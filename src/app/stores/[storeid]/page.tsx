import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  generateMetadata as buildMetadata,
  generateSellerMetadata,
  generateStoreJsonLd,
} from '@/lib/seo';
import StoreDetailClient from './StoreDetailClient';

async function fetchStoreDetail(slug: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });

  if (!seller || seller.verificationStatus !== 'APPROVED') {
    return null;
  }

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id, status: 'ACTIVE' },
    orderBy: [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
    take: 24,
    select: {
      id: true,
      title: true,
      titleAr: true,
      slug: true,
      price: true,
      ratingAvg: true,
      ratingCount: true,
      images: {
        select: { url: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
  });

  return {
    seller,
    products: products.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
    pagination: { page: 1, totalPages: 1 },
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ storeid: string }> }
): Promise<Metadata> {
  const { storeid } = await params;
  const seller = await prisma.sellerProfile.findUnique({
    where: { slug: storeid },
  });

  if (!seller || seller.verificationStatus !== 'APPROVED') {
    return buildMetadata({
      title: 'المتجر غير موجود',
      description: 'هذا المتجر غير متاح حالياً.',
    });
  }

  return buildMetadata(generateSellerMetadata(seller));
}

export default async function StoreDetailPage(
  { params }: { params: Promise<{ storeid: string }> }
) {
  const { storeid } = await params;
  const store = await fetchStoreDetail(storeid);
  if (!store) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'الرئيسية', url: '/' },
    { name: 'المتاجر', url: '/stores' },
    { name: store.seller.storeName, url: `/stores/${store.seller.slug}` },
  ];

  const storeJsonLd = generateStoreJsonLd(store.seller);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const itemListJsonLd = generateItemListJsonLd(
    store.products.map((product) => ({
      name: product.titleAr || product.title,
      url: `/products/${product.slug}`,
      image: product.images[0]?.url || null,
    })),
    `/stores/${store.seller.slug}`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <StoreDetailClient initialStore={store} slug={storeid} />
    </>
  );
}
