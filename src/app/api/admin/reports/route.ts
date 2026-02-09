import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema, reportStatusSchema, targetTypeSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';

const filterSchema = paginationSchema.extend({
  status: reportStatusSchema.optional(),
  targetType: targetTypeSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status, targetType } = filterSchema.parse(params);
    
    const where = {
      ...(status && { status }),
      ...(targetType && { targetType }),
    };
    
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(reports, pagination);
  } catch (err) {
    return handleError(err);
  }
}
