import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, handleError } from '@/lib/api-response';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // LIVE, SCHEDULED, ENDED
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const where: Record<string, string> = {};
    if (status) {
      where.status = status;
    }

    const streams = await db.liveStream.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            ratingAvg: true,
            ratingCount: true,
            user: {
              select: { image: true, name: true },
            },
          },
        },
        products: {
          orderBy: { sortOrder: 'asc' },
          take: 6,
        },
      },
      orderBy: [
        { status: 'asc' }, // LIVE first
        { scheduledAt: 'asc' },
        { startedAt: 'desc' },
      ],
      take: limit,
    });

    // Fetch product details for each stream's products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allProductIds = streams.flatMap((s: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s.products.map((p: any) => p.productId)
    );

    const products = allProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: allProductIds }, status: 'ACTIVE' },
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
            category: { select: { name: true, nameAr: true, slug: true } },
          },
        })
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedStreams = streams.map((stream: any) => ({
      id: stream.id,
      title: stream.title,
      titleAr: stream.titleAr,
      description: stream.description,
      descriptionAr: stream.descriptionAr,
      thumbnail: stream.thumbnail,
      status: stream.status,
      scheduledAt: stream.scheduledAt,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      viewerCount: stream.viewerCount,
      peakViewers: stream.peakViewers,
      seller: {
        storeName: stream.seller.storeName,
        slug: stream.seller.slug,
        ratingAvg: stream.seller.ratingAvg,
        image: stream.seller.user?.image,
        name: stream.seller.user?.name,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products: stream.products.map((sp: any) => {
        const product = productMap.get(sp.productId);
        return {
          id: sp.productId,
          specialPrice: sp.specialPrice ? Number(sp.specialPrice) : null,
          discount: sp.discount,
          title: product?.titleAr || product?.title || '',
          price: product ? Number(product.price) : 0,
          image: product?.images[0]?.url || null,
          slug: product?.slug || '',
          category: product?.category,
        };
      }),
    }));

    return success(enrichedStreams);
  } catch (err) {
    return handleError(err);
  }
}
