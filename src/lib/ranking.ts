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
