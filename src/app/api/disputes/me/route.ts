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
    
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where: { openedById: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          status: true,
          reason: true,
          outcome: true,
          createdAt: true,
          updatedAt: true,
          order: {
            select: {
              id: true,
              total: true,
              seller: {
                select: {
                  id: true,
                  storeName: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.dispute.count({ where: { openedById: user.id } }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(disputes, pagination);
  } catch (err) {
    return handleError(err);
  }
}
