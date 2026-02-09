import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError, paginationMeta } from '@/lib/api-response';

/**
 * GET /api/admin/ranking/products
 * List products with ranking information
 * Query params: page, limit, sort, pinned, hasBoost, hasPenalty
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const sort = searchParams.get('sort') || 'score';
    const pinnedOnly = searchParams.get('pinned') === 'true';
    const hasBoosted = searchParams.get('hasBoost') === 'true';
    const hasPenalty = searchParams.get('hasPenalty') === 'true';
    const search = searchParams.get('search');
    
    // Build where clause
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
    };
    
    if (pinnedOnly) where.pinned = true;
    if (hasBoosted) where.manualBoost = { gt: 0 };
    if (hasPenalty) where.penaltyScore = { gt: 0 };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { titleAr: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Build orderBy
    const orderBy: Record<string, string>[] = [];
    if (sort === 'score') {
      orderBy.push({ pinned: 'desc' }, { score: 'desc' });
    } else if (sort === 'newest') {
      orderBy.push({ createdAt: 'desc' });
    } else if (sort === 'boosted') {
      orderBy.push({ manualBoost: 'desc' });
    } else if (sort === 'penalized') {
      orderBy.push({ penaltyScore: 'desc' });
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          price: true,
          score: true,
          pinned: true,
          manualBoost: true,
          penaltyScore: true,
          ratingAvg: true,
          ratingCount: true,
          viewCount: true,
          createdAt: true,
          seller: {
            select: { storeName: true, slug: true },
          },
          category: {
            select: { name: true },
          },
          images: {
            select: { url: true },
            take: 1,
          },
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);
    
    // Get summary stats
    const stats = await prisma.product.aggregate({
      where: { status: 'ACTIVE' },
      _count: true,
      _avg: { score: true, manualBoost: true, penaltyScore: true },
    });
    
    const [pinnedCount, boostedCount, penalizedCount] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE', pinned: true } }),
      prisma.product.count({ where: { status: 'ACTIVE', manualBoost: { gt: 0 } } }),
      prisma.product.count({ where: { status: 'ACTIVE', penaltyScore: { gt: 0 } } }),
    ]);
    
    return success({
      products,
      stats: {
        total: stats._count,
        avgScore: stats._avg.score || 0,
        avgBoost: stats._avg.manualBoost || 0,
        avgPenalty: stats._avg.penaltyScore || 0,
        pinnedCount,
        boostedCount,
        penalizedCount,
      },
      pagination: paginationMeta(total, page, limit),
    });
  } catch (err) {
    return handleError(err);
  }
}
