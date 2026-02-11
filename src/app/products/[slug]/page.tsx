import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  generateBreadcrumbJsonLd,
  generateMetadata as buildMetadata,
  generateProductJsonLd,
  generateProductMetadata,
} from '@/lib/seo';
import ProductDetailClient from './ProductDetailClient';

interface ProductDetail {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  description: string;
  descriptionAr?: string;
  price: number;
  quantity: number;
  condition: string;
  images: { id: string; url: string; alt?: string | null; sortOrder?: number | null }[];
  category: { id: string; name: string; nameAr?: string; slug?: string } | null;
  seller: {
    id: string;
    storeName: string;
    slug: string;
    user: { name: string };
    verificationStatus?: string;
    verificationLevel?: string;
  };
  ratingAvg: number | null;
  ratingCount: number;
  ratingSummary?: {
    average: number | null;
    total: number;
    distribution: Record<string, number>;
  };
  reviews: {
    id: string;
    rating: number;
    comment: string;
    customer: { name: string };
    createdAt: string;
  }[];
}

async function fetchProductSeo(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, select: { url: true } },
      seller: true,
    },
  });
}

async function fetchProductDetail(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      seller: {
        include: {
          user: { select: { name: true } },
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

  if (!product || product.status !== 'ACTIVE') {
    return null;
  }

  let ratingDistribution: { rating: number; _count: number }[] = [];
  try {
    const grouped = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId: product.id,
        status: 'APPROVED',
      },
      _count: true,
    });
    ratingDistribution = grouped as unknown as { rating: number; _count: number }[];
  } catch {
    // Gracefully handle groupBy failure
  }

  const ratingSummary = {
    average: product.ratingAvg ?? 0,
    total: product._count?.reviews ?? 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      ...Object.fromEntries(ratingDistribution.map((r) => [r.rating, r._count])),
    },
  };

  const clientProduct: ProductDetail = {
    id: product.id,
    title: product.title,
    titleAr: product.titleAr || undefined,
    slug: product.slug,
    description: product.description,
    descriptionAr: product.descriptionAr || undefined,
    price: Number(product.price),
    quantity: product.quantity,
    condition: product.condition,
    images: (product.images || []).map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          nameAr: product.category.nameAr || undefined,
          slug: product.category.slug,
        }
      : null,
    seller: {
      id: product.seller.id,
      storeName: product.seller.storeName,
      slug: product.seller.slug,
      user: { name: product.seller.user?.name || 'مستخدم' },
      verificationStatus: product.seller.verificationStatus,
      verificationLevel: product.seller.verificationLevel || undefined,
    },
    ratingAvg: product.ratingAvg ?? 0,
    ratingCount: product.ratingCount ?? 0,
    ratingSummary,
    reviews: (product.reviews || []).map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || '',
      customer: { name: review.customer?.name || 'مستخدم' },
      createdAt: review.createdAt.toISOString(),
    })),
  };

  return { client: clientProduct, seo: product };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await fetchProductSeo(slug);
    if (!product || product.status !== 'ACTIVE') {
      return buildMetadata({
        title: 'المنتج غير موجود',
        description: 'المنتج غير متاح حالياً.',
      });
    }

    return buildMetadata(generateProductMetadata(product));
  } catch (err) {
    console.error('generateMetadata error:', err);
    return buildMetadata({
      title: 'المنتج غير موجود',
      description: 'المنتج غير متاح حالياً.',
    });
  }
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let result: Awaited<ReturnType<typeof fetchProductDetail>>;
  try {
    result = await fetchProductDetail(slug);
  } catch (err) {
    console.error('ProductDetailPage fetch error:', err);
    notFound();
  }

  if (!result) {
    notFound();
  }

  const { client, seo } = result;

  const breadcrumbs = [
    { name: 'الرئيسية', url: '/' },
    { name: 'المنتجات', url: '/products' },
    ...(seo?.category
      ? [
          {
            name: seo.category.nameAr || seo.category.name,
            url: `/categories/${seo.category.slug}`,
          },
        ]
      : []),
    { name: seo.titleAr || seo.title, url: `/products/${seo.slug}` },
  ];

  const productJsonLd = generateProductJsonLd({
    ...seo,
    images: seo.images,
    category: null,
  });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient initialProduct={client} slug={slug} />
    </>
  );
}
