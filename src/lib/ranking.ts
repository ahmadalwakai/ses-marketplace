import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export interface RankingWeights {
  w_recency: number;
  w_rating: number;
  w_orders: number;
  w_stock: number;
  w_sellerRep: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  w_recency: 0.3,
  w_rating: 0.25,
  w_orders: 0.2,
  w_stock: 0.15,
  w_sellerRep: 0.1,
};

/**
 * Get ranking weights from admin settings
 */
export async function getRankingWeights(): Promise<RankingWeights> {
  const settings = await prisma.adminSettings.findUnique({
    where: { id: 'singleton' },
    select: { rankingWeights: true },
  });
  
  if (!settings?.rankingWeights) {
    return DEFAULT_WEIGHTS;
  }
  
  return { ...DEFAULT_WEIGHTS, ...(settings.rankingWeights as unknown as RankingWeights) };
}

/**
 * Calculate recency score (0-1) based on product creation date
 * Products created within the last 30 days get higher scores
 */
function calculateRecencyScore(createdAt: Date): number {
  const now = new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Products older than 365 days get 0
  if (ageInDays > 365) return 0;
  
  // Linear decay from 1 (new) to 0 (365 days old)
  return Math.max(0, 1 - ageInDays / 365);
}

/**
 * Calculate rating score (0-1) normalized from 0-5 star rating
 */
function calculateRatingScore(ratingAvg: number, ratingCount: number): number {
  if (ratingCount === 0) return 0.5; // Neutral for new products
  
  // Use Wilson score interval for more accurate ranking
  // Simplified: just normalize to 0-1
  return ratingAvg / 5;
}

/**
 * Calculate orders score (0-1) based on order history
 */
function calculateOrdersScore(orderCount: number): number {
  // Logarithmic scaling to prevent high-volume products from dominating
  // Max score at ~100 orders
  return Math.min(1, Math.log10(orderCount + 1) / 2);
}

/**
 * Calculate stock score (0-1)
 */
function calculateStockScore(quantity: number): number {
  if (quantity === 0) return 0;
  if (quantity >= 10) return 1;
  return quantity / 10;
}

/**
 * Calculate seller reputation score (0-1)
 */
function calculateSellerRepScore(sellerRatingAvg: number, sellerRatingCount: number): number {
  if (sellerRatingCount === 0) return 0.5;
  return sellerRatingAvg / 5;
}

/**
 * Calculate product score based on all factors
 */
export function calculateProductScore(
  product: {
    createdAt: Date;
    ratingAvg: number;
    ratingCount: number;
    quantity: number;
    manualBoost: number;
    penaltyScore: number;
  },
  seller: {
    ratingAvg: number;
    ratingCount: number;
  },
  orderCount: number,
  weights: RankingWeights
): number {
  const recency = calculateRecencyScore(product.createdAt);
  const rating = calculateRatingScore(product.ratingAvg, product.ratingCount);
  const orders = calculateOrdersScore(orderCount);
  const stock = calculateStockScore(product.quantity);
  const sellerRep = calculateSellerRepScore(seller.ratingAvg, seller.ratingCount);
  
  const baseScore = 
    weights.w_recency * recency +
    weights.w_rating * rating +
    weights.w_orders * orders +
    weights.w_stock * stock +
    weights.w_sellerRep * sellerRep;
  
  // Apply manual boost and penalty
  const finalScore = baseScore + product.manualBoost - product.penaltyScore;
  
  // Clamp to 0-10 range
  return Math.max(0, Math.min(10, finalScore));
}

/**
 * Recompute scores for all active products
 */
export async function recomputeAllScores(batchSize = 100): Promise<number> {
  const weights = await getRankingWeights();
  let updated = 0;
  let skip = 0;
  
  while (true) {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        seller: {
          select: { ratingAvg: true, ratingCount: true },
        },
        _count: {
          select: { orderItems: true },
        },
      },
      skip,
      take: batchSize,
    });
    
    if (products.length === 0) break;
    
    const updates: Prisma.Prisma__ProductClient<unknown>[] = products.map((product) => {
      const score = calculateProductScore(
        {
          createdAt: product.createdAt,
          ratingAvg: product.ratingAvg,
          ratingCount: product.ratingCount,
          quantity: product.quantity,
          manualBoost: product.manualBoost,
          penaltyScore: product.penaltyScore,
        },
        {
          ratingAvg: product.seller.ratingAvg,
          ratingCount: product.seller.ratingCount,
        },
        product._count.orderItems,
        weights
      );
      
      return prisma.product.update({
        where: { id: product.id },
        data: { score },
      });
    });
    
    await prisma.$transaction(updates);
    
    updated += products.length;
    skip += batchSize;
  }
  
  return updated;
}

/**
 * Recompute score for a single product
 */
export async function recomputeProductScore(productId: string): Promise<number> {
  const weights = await getRankingWeights();
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: { ratingAvg: true, ratingCount: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
  });
  
  if (!product) throw new Error('Product not found');
  
  const score = calculateProductScore(
    {
      createdAt: product.createdAt,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      quantity: product.quantity,
      manualBoost: product.manualBoost,
      penaltyScore: product.penaltyScore,
    },
    {
      ratingAvg: product.seller.ratingAvg,
      ratingCount: product.seller.ratingCount,
    },
    product._count.orderItems,
    weights
  );
  
  await prisma.product.update({
    where: { id: productId },
    data: { score },
  });
  
  return score;
}

export interface ScoreExplanation {
  productId: string;
  productTitle: string;
  finalScore: number;
  isPinned: boolean;
  breakdown: {
    recency: { raw: number; weight: number; weighted: number; description: string };
    rating: { raw: number; weight: number; weighted: number; description: string };
    orders: { raw: number; weight: number; weighted: number; description: string };
    stock: { raw: number; weight: number; weighted: number; description: string };
    sellerRep: { raw: number; weight: number; weighted: number; description: string };
  };
  baseScore: number;
  adjustments: {
    manualBoost: number;
    penaltyScore: number;
  };
  factors: {
    ageInDays: number;
    ratingAvg: number;
    ratingCount: number;
    orderCount: number;
    quantity: number;
    sellerRatingAvg: number;
    sellerRatingCount: number;
  };
}

/**
 * Explain how a product's score was calculated
 */
export async function explainScore(productId: string): Promise<ScoreExplanation> {
  const weights = await getRankingWeights();
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      seller: {
        select: { ratingAvg: true, ratingCount: true },
      },
      _count: {
        select: { orderItems: true },
      },
    },
  });
  
  if (!product) throw new Error('Product not found');
  
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate raw scores
  const rawRecency = ageInDays > 365 ? 0 : Math.max(0, 1 - ageInDays / 365);
  const rawRating = product.ratingCount === 0 ? 0.5 : product.ratingAvg / 5;
  const rawOrders = Math.min(1, Math.log10(product._count.orderItems + 1) / 2);
  const rawStock = product.quantity === 0 ? 0 : product.quantity >= 10 ? 1 : product.quantity / 10;
  const rawSellerRep = product.seller.ratingCount === 0 ? 0.5 : product.seller.ratingAvg / 5;
  
  // Calculate weighted scores
  const weightedRecency = weights.w_recency * rawRecency;
  const weightedRating = weights.w_rating * rawRating;
  const weightedOrders = weights.w_orders * rawOrders;
  const weightedStock = weights.w_stock * rawStock;
  const weightedSellerRep = weights.w_sellerRep * rawSellerRep;
  
  const baseScore = weightedRecency + weightedRating + weightedOrders + weightedStock + weightedSellerRep;
  const finalScore = Math.max(0, Math.min(10, baseScore + product.manualBoost - product.penaltyScore));
  
  return {
    productId: product.id,
    productTitle: product.title,
    finalScore: Math.round(finalScore * 1000) / 1000,
    isPinned: product.pinned,
    breakdown: {
      recency: {
        raw: Math.round(rawRecency * 1000) / 1000,
        weight: weights.w_recency,
        weighted: Math.round(weightedRecency * 1000) / 1000,
        description: `المنتج عمره ${ageInDays} يوم (السنة = 0, جديد = 1)`,
      },
      rating: {
        raw: Math.round(rawRating * 1000) / 1000,
        weight: weights.w_rating,
        weighted: Math.round(weightedRating * 1000) / 1000,
        description: `${product.ratingAvg}/5 من ${product.ratingCount} تقييم`,
      },
      orders: {
        raw: Math.round(rawOrders * 1000) / 1000,
        weight: weights.w_orders,
        weighted: Math.round(weightedOrders * 1000) / 1000,
        description: `${product._count.orderItems} طلب (مقياس لوغاريتمي)`,
      },
      stock: {
        raw: Math.round(rawStock * 1000) / 1000,
        weight: weights.w_stock,
        weighted: Math.round(weightedStock * 1000) / 1000,
        description: `${product.quantity} وحدة متوفرة`,
      },
      sellerRep: {
        raw: Math.round(rawSellerRep * 1000) / 1000,
        weight: weights.w_sellerRep,
        weighted: Math.round(weightedSellerRep * 1000) / 1000,
        description: `سمعة البائع ${product.seller.ratingAvg}/5`,
      },
    },
    baseScore: Math.round(baseScore * 1000) / 1000,
    adjustments: {
      manualBoost: product.manualBoost,
      penaltyScore: product.penaltyScore,
    },
    factors: {
      ageInDays,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
      orderCount: product._count.orderItems,
      quantity: product.quantity,
      sellerRatingAvg: product.seller.ratingAvg,
      sellerRatingCount: product.seller.ratingCount,
    },
  };
}

