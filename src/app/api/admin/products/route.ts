import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema, productStatusSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const filterSchema = paginationSchema.extend({
  status: productStatusSchema.optional(),
  sellerId: z.string().cuid().optional(),
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status, sellerId, q } = filterSchema.parse(params);
    
    const where: Prisma.ProductWhereInput = {
      ...(status && { status }),
      ...(sellerId && { sellerId }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { titleAr: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
          status: true,
          score: true,
          manualBoost: true,
          penaltyScore: true,
          pinned: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          updatedAt: true,
          images: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          seller: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              user: {
                select: { id: true, email: true, name: true },
              },
            },
          },
          category: {
            select: { id: true, name: true, nameAr: true },
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
