import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { productFilterSchema } from '@/lib/validations';
import { handleError, paginationMeta, success } from '@/lib/api-response';
import type { Prisma } from '@prisma/client';

function normalizeArabic(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ؤ]/g, 'و')
    .replace(/[ئ]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/\u0640/g, '')
    .trim();
}

function buildSearchTerms(input: string): string[] {
  const rawTerms = input.split(/\s+/).filter(Boolean);
  const normalizedInput = normalizeArabic(input);
  const normalizedTerms = normalizedInput.split(/\s+/).filter(Boolean);

  const termSet = new Set<string>([...rawTerms, ...normalizedTerms]);
  return Array.from(termSet).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    
    // Handle autocomplete mode
    if (mode === 'autocomplete') {
      const q = (searchParams.get('q') || '').trim();
      const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);

      if (q.length < 2) {
        const settings = await prisma.adminSettings.findUnique({
          where: { id: 'singleton' },
          select: { searchConfig: true },
        });
        const searchConfig = settings?.searchConfig as { popularSearches?: string[] } | null;
        const popular = (searchConfig?.popularSearches || []).slice(0, limit);

        const popularSuggestions = popular.map((term, index) => ({
          id: `popular-${index}`,
          title: term,
          type: 'search' as const,
          query: term,
        }));

        return success(popularSuggestions);
      }

      const normalized = normalizeArabic(q);
      const orFilters: Prisma.ProductWhereInput[] = [
        { title: { contains: q, mode: 'insensitive' } },
        { titleAr: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];

      if (normalized && normalized !== q) {
        orFilters.push(
          { title: { contains: normalized, mode: 'insensitive' } },
          { titleAr: { contains: normalized, mode: 'insensitive' } },
          { brand: { contains: normalized, mode: 'insensitive' } }
        );
      }

      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: orFilters,
        },
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          images: {
            select: { url: true },
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
        take: limit,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      });

      const suggestions = products.map((p) => ({
        id: p.id,
        title: p.titleAr || p.title,
        type: 'product' as const,
        slug: p.slug,
        image: p.images[0]?.url || null,
      }));

      return success(suggestions);
    }
    
    // Regular search
    const params = Object.fromEntries(searchParams.entries());
    const filters = productFilterSchema.parse(params);
    
    const { page, limit, q, categoryId, condition, minPrice, maxPrice, minRating, sellerId, inStock, sort } = filters;
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    };
    
    // Full-text search across multiple fields
    if (q) {
      const searchTerms = buildSearchTerms(q);
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

    if (sellerId) {
      where.sellerId = sellerId;
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

    if (inStock) {
      where.quantity = { gt: 0 };
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
    
    return success({
      items: products,
      pagination,
      aggregations,
    });
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
  const [conditions, priceRange, categories, sellers] = await Promise.all([
    prisma.product.groupBy({
      by: ['condition'],
      where,
      _count: true,
    }),
    prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.product.groupBy({
      by: ['categoryId'],
      where: { ...where, categoryId: { not: null } },
      _count: true,
    }),
    prisma.product.groupBy({
      by: ['sellerId'],
      where,
      _count: true,
    }),
  ]);

  const categoryIds = categories
    .map((c) => c.categoryId)
    .filter((id): id is string => Boolean(id));
  const sellerIds = sellers.map((s) => s.sellerId);

  const [categoryDetails, sellerDetails] = await Promise.all([
    categoryIds.length
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, nameAr: true, slug: true },
        })
      : Promise.resolve([]),
    sellerIds.length
      ? prisma.sellerProfile.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, storeName: true, slug: true, verificationStatus: true },
        })
      : Promise.resolve([]),
  ]);

  const categoryLookup = new Map(categoryDetails.map((c) => [c.id, c]));
  const sellerLookup = new Map(sellerDetails.map((s) => [s.id, s]));

  return {
    conditions: conditions.map((c) => ({
      condition: c.condition,
      count: c._count,
    })),
    priceRange: {
      min: priceRange._min.price || 0,
      max: priceRange._max.price || 0,
    },
    categories: categories
      .map((c) => ({
        categoryId: c.categoryId,
        count: c._count,
        category: c.categoryId ? categoryLookup.get(c.categoryId) || null : null,
      }))
      .filter((c) => c.categoryId),
    sellers: sellers.map((s) => ({
      sellerId: s.sellerId,
      count: s._count,
      seller: sellerLookup.get(s.sellerId) || null,
    })),
  };
}
