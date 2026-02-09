import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomer } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomer();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(params);
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          subtotal: true,
          total: true,
          deliveryMode: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              titleSnapshot: true,
              priceSnapshot: true,
              qty: true,
              lineTotal: true,
              product: {
                select: {
                  id: true,
                  slug: true,
                  images: {
                    select: { url: true },
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
          seller: {
            select: {
              id: true,
              storeName: true,
              slug: true,
            },
          },
          _count: {
            select: { reviews: true },
          },
        },
      }),
      prisma.order.count({ where: { customerId: user.id } }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(orders, pagination);
  } catch (err) {
    return handleError(err);
  }
}
