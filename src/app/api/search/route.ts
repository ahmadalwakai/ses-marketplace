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
    
    const { page, limit, q, categoryId, condition, minPrice, maxPrice, minRating, sort } = filters;
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    };
    
    // Full-text search across multiple fields
    if (q) {
      const searchTerms = q.split(/\s+/).filter(Boolean);
      where.AND = searchTerms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' as const } },
          { titleAr: { contains: term, mode: 'insensitive' as const } },
          { description: { contains: term, mode: 'insensitive' as const } },
          { descriptionAr: { contains: term, mode: 'insensitive' as const } },
          { brand: { contains: term, mode: 'insensitive' as const } },
          { tags: { array_contains: term.toLowerCase() } },
          {
            seller: {
              storeName: { contains: term, mode: 'insensitive' as const },
            },
          },
          {
            category: {
              OR: [
                { name: { contains: term, mode: 'insensitive' as const } },
                { nameAr: { contains: term, mode: 'insensitive' as const } },
              ],
            },
          },
        ],
      }));
    }
    
    if (categoryId) {
      // Include subcategories
      const categoryIds = await getSubcategoryIds(categoryId);
      where.categoryId = { in: categoryIds };
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
        orderBy = [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }];
        break;
    }
    
    // Execute query
    const [products, total, aggregations] = await Promise.all([
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
      getSearchAggregations(where),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(products, pagination);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * Get all subcategory IDs for a given category
 */
async function getSubcategoryIds(categoryId: string): Promise<string[]> {
  const ids: string[] = [categoryId];
  
  const children = await prisma.category.findMany({
    where: { parentId: categoryId, isActive: true },
    select: { id: true },
  });
  
  for (const child of children) {
    const subIds = await getSubcategoryIds(child.id);
    ids.push(...subIds);
  }
  
  return ids;
}

/**
 * Get aggregations for search filters
 */
async function getSearchAggregations(where: Prisma.ProductWhereInput) {
  const [conditions, priceRange, categories] = await Promise.all([
    // Condition counts
    prisma.product.groupBy({
      by: ['condition'],
      where,
      _count: true,
    }),
    // Price range
    prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
    }),
    // Category counts
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { ...where, categoryId: { not: null } },
      _count: true,
    }),
  ]);
  
  return {
    conditions: conditions.map((c) => ({ condition: c.condition, count: c._count })),
    priceRange: {
      min: priceRange._min.price?.toNumber() || 0,
      max: priceRange._max.price?.toNumber() || 0,
    },
    categories: categories.map((c) => ({ categoryId: c.categoryId, count: c._count })),
  };
}
