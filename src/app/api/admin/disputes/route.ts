import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema, disputeStatusSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';

const filterSchema = paginationSchema.extend({
  status: disputeStatusSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status } = filterSchema.parse(params);
    
    const where = {
      ...(status && { status }),
    };
    
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          openedBy: {
            select: { id: true, name: true, email: true },
          },
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              customer: { select: { id: true, name: true, email: true } },
              seller: { select: { id: true, storeName: true, slug: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: { select: { id: true, name: true, role: true } },
            },
          },
        },
      }),
      prisma.dispute.count({ where }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(disputes, pagination);
  } catch (err) {
    return handleError(err);
  }
}
