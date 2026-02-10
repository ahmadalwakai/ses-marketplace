import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(params);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: user.sellerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          price: true,
          quantity: true,
          status: true,
          images: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.product.count({ where: { sellerId: user.sellerId } }),
    ]);

    const pagination = paginationMeta(page, limit, total);
    return paginated(products, pagination);
  } catch (err) {
    return handleError(err);
  }
}
