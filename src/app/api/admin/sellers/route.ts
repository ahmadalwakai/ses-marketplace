import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const filterSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, status, q } = filterSchema.parse(params);

    const where: Prisma.SellerProfileWhereInput = {
      ...(status && { verificationStatus: status }),
      ...(q && {
        OR: [
          { storeName: { contains: q, mode: 'insensitive' as const } },
          { user: { name: { contains: q, mode: 'insensitive' as const } } },
          { user: { email: { contains: q, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          storeName: true,
          slug: true,
          bio: true,
          verificationStatus: true,
          verificationLevel: true,
          isSmallBusiness: true,
          ratingAvg: true,
          ratingCount: true,
          totalSales: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    const pagination = paginationMeta(page, limit, total);
    return paginated(sellers, pagination);
  } catch (err) {
    return handleError(err);
  }
}
