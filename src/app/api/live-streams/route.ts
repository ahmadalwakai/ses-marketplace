import { NextRequest } from 'next/server';
import { LiveStreamStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { success, handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status'); // LIVE, SCHEDULED, ENDED
    const limitParam = Number.parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Number.isNaN(limitParam) ? 20 : limitParam, 50);

    const status = statusParam && Object.values(LiveStreamStatus).includes(statusParam as LiveStreamStatus)
      ? (statusParam as LiveStreamStatus)
      : null;
    const where: Prisma.LiveStreamWhereInput = status ? { status } : {};

    const streamQuery = Prisma.validator<Prisma.LiveStreamFindManyArgs>()({
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
          select: {
            productId: true,
            specialPrice: true,
            discount: true,
          },
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

    const streams = await prisma.liveStream.findMany(streamQuery);
    type LiveStreamWithRelations = Prisma.LiveStreamGetPayload<typeof streamQuery>;

    // Fetch product details for each stream's products
    const allProductIds = streams.flatMap((stream: LiveStreamWithRelations) =>
      stream.products.map((product) => product.productId)
    );

    const productQuery = Prisma.validator<Prisma.ProductFindManyArgs>()({
      where: { id: { in: allProductIds }, status: 'ACTIVE' },
      include: {
        images: {
          select: { url: true },
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
        category: { select: { name: true, nameAr: true, slug: true } },
      },
    });
    type ProductWithRelations = Prisma.ProductGetPayload<typeof productQuery>;

    const products: ProductWithRelations[] = allProductIds.length > 0
      ? await prisma.product.findMany(productQuery)
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));

    const enrichedStreams = streams.map((stream: LiveStreamWithRelations) => ({
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
      products: stream.products.map((streamProduct) => {
        const product = productMap.get(streamProduct.productId);
        return {
          id: streamProduct.productId,
          specialPrice: streamProduct.specialPrice ? Number(streamProduct.specialPrice) : null,
          discount: streamProduct.discount,
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
