import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(params);
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }, // Oldest first for moderation
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          product: {
            select: { id: true, title: true, titleAr: true, slug: true },
          },
          order: {
            select: { id: true, status: true, createdAt: true },
          },
        },
      }),
      prisma.review.count({ where: { status: 'PENDING' } }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(reviews, pagination);
  } catch (err) {
    return handleError(err);
  }
}
