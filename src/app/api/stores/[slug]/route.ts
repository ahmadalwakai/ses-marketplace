import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error, handleError, paginationMeta, paginated } from '@/lib/api-response';
import { paginationSchema } from '@/lib/validations';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const paginationParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(paginationParams);
    
    const seller = await prisma.sellerProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        storeName: true,
        slug: true,
        bio: true,
        ratingAvg: true,
        ratingCount: true,
        verificationStatus: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!seller) {
      return error('المتجر غير موجود', 'NOT_FOUND', 404);
    }
    
    if (seller.verificationStatus !== 'APPROVED') {
      return error('المتجر غير متاح', 'NOT_AVAILABLE', 404);
    }
    
    // Get seller's active products
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          sellerId: seller.id,
          status: 'ACTIVE',
        },
        orderBy: [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          titleAr: true,
          slug: true,
          condition: true,
          price: true,
          currency: true,
          quantity: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          images: {
            select: { url: true, alt: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.product.count({
        where: {
          sellerId: seller.id,
          status: 'ACTIVE',
        },
      }),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return success({
      seller,
      products,
      pagination,
    });
  } catch (err) {
    return handleError(err);
  }
}
