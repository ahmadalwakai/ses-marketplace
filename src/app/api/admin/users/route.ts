import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const filterSchema = paginationSchema.extend({
  role: z.enum(['VISITOR', 'CUSTOMER', 'SELLER', 'ADMIN']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, role, status, q } = filterSchema.parse(params);
    
    const where: Prisma.UserWhereInput = {
      ...(role && { role }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          sellerProfile: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              verificationStatus: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(users, pagination);
  } catch (err) {
    return handleError(err);
  }
}
