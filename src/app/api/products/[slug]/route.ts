import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            bio: true,
            ratingAvg: true,
            ratingCount: true,
            verificationStatus: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'NOT_FOUND', 404);
    }
    
    // Don't show non-active products to public
    if (product.status !== 'ACTIVE') {
      return error('المنتج غير متاح', 'NOT_AVAILABLE', 404);
    }
    
    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId: product.id,
        status: 'APPROVED',
      },
      _count: true,
    });
    
    const ratingSummary = {
      average: product.ratingAvg,
      total: product._count.reviews,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        ...Object.fromEntries(
          ratingDistribution.map((r) => [r.rating, r._count])
        ),
      },
    };
    
    return success({
      ...product,
      ratingSummary,
    });
  } catch (err) {
    return handleError(err);
  }
}
