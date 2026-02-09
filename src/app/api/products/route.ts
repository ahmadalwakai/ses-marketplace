import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { productFilterSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filters = productFilterSchema.parse(params);
    
    const { page, limit, q, categoryId, condition, minPrice, maxPrice, minRating, sellerId, smallBusiness, sort } = filters;
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    };
    
    // Small Business filter: products from verified (approved) sellers
    if (smallBusiness) {
      where.seller = {
        verificationStatus: 'APPROVED',
      };
    }
    
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' as const } },
        { titleAr: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { descriptionAr: { contains: q, mode: 'insensitive' as const } },
        { brand: { contains: q, mode: 'insensitive' as const } },
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (condition) {
      where.condition = condition;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }
    
    if (minRating !== undefined) {
      where.ratingAvg = { gte: minRating };
    }
    
    if (sellerId) {
      where.sellerId = sellerId;
    }
    
    // Build order by
    let orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    
    switch (sort) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }];
        break;
      case 'price_asc':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price_desc':
        orderBy = [{ price: 'desc' }];
        break;
      case 'rating':
        orderBy = [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
        break;
      case 'relevance':
      default:
        // Sort by pinned first, then score, then recency
        orderBy = [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }];
        break;
    }
    
    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          condition: true,
          price: true,
          currency: true,
          quantity: true,
          ratingAvg: true,
          ratingCount: true,
          pinned: true,
          createdAt: true,
          images: {
            select: { url: true, alt: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          seller: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              ratingAvg: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(products, pagination);
  } catch (err) {
    return handleError(err);
  }
}
