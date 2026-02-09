import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';

const filterSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED', 'RESOLVED']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status } = filterSchema.parse(params);
    
    const where = {
      sellerId: user.sellerId,
      ...(status && { status }),
    };
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          subtotal: true,
          commissionTotal: true,
          total: true,
          deliveryMode: true,
          deliveryAddress: true,
          phone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              titleSnapshot: true,
              priceSnapshot: true,
              qty: true,
              lineTotal: true,
              commissionAmount: true,
              sellerNetAmount: true,
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
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(orders, pagination);
  } catch (err) {
    return handleError(err);
  }
}
