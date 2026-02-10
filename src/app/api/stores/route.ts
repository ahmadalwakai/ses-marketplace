import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, handleError, paginated, paginationMeta } from '@/lib/api-response';
import { paginationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(params);

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where: { verificationStatus: 'APPROVED' },
        orderBy: [{ ratingAvg: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          storeName: true,
          slug: true,
          bio: true,
          ratingAvg: true,
          ratingCount: true,
          verificationStatus: true,
          verificationLevel: true,
          createdAt: true,
          _count: { select: { products: true } },
        },
      }),
      prisma.sellerProfile.count({
        where: { verificationStatus: 'APPROVED' },
      }),
    ]);

    return paginated(sellers, paginationMeta(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
