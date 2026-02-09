import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { paginationSchema } from '@/lib/validations';
import { paginated, handleError, paginationMeta } from '@/lib/api-response';

interface Props {
  params: Promise<{ productId: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const paginationParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(paginationParams);
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: {
          productId,
          status: 'APPROVED',
        },
      }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(reviews, pagination);
  } catch (err) {
    return handleError(err);
  }
}
