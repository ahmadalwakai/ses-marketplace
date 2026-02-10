import prisma from '@/lib/prisma';
import { generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/lib/seo';
import ProductsListClient from './ProductsListClient';

async function fetchListingProducts() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
    take: 24,
    select: {
      title: true,
      titleAr: true,
      slug: true,
      images: {
        select: { url: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
  });

  return products.map((product) => ({
    name: product.titleAr || product.title,
    url: `/products/${product.slug}`,
    image: product.images[0]?.url || null,
  }));
}

export default async function ProductsPage() {
  const listItems = await fetchListingProducts();
  const itemListJsonLd = generateItemListJsonLd(listItems, '/products');
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'الرئيسية', url: '/' },
    { name: 'المنتجات', url: '/products' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductsListClient />
    </>
  );
}