import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema, orderStatusSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';

const filterSchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
  sellerId: z.string().cuid().optional(),
  customerId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status, sellerId, customerId } = filterSchema.parse(params);
    
    const where = {
      ...(status && { status }),
      ...(sellerId && { sellerId }),
      ...(customerId && { customerId }),
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
          phone: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              titleSnapshot: true,
              qty: true,
              lineTotal: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              storeName: true,
              slug: true,
            },
          },
          dispute: {
            select: {
              id: true,
              status: true,
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
