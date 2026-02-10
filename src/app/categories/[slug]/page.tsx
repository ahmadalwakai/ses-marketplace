import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import {
  generateBreadcrumbJsonLd,
  generateCategoryJsonLd,
  generateCategoryMetadata,
  generateItemListJsonLd,
  generateMetadata as buildMetadata,
} from '@/lib/seo';
import CategoryDetailClient from './CategoryDetailClient';

async function fetchCategoryDetail(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { products: true } },
    },
  });

  if (!category || !category.isActive) {
    return null;
  }

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, status: 'ACTIVE' },
    orderBy: [{ pinned: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
    take: 24,
    select: {
      id: true,
      title: true,
      titleAr: true,
      slug: true,
      price: true,
      condition: true,
      ratingAvg: true,
      ratingCount: true,
      images: {
        select: { url: true, alt: true },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
      category: { select: { id: true, name: true, nameAr: true, slug: true } },
      seller: { select: { id: true, storeName: true, slug: true } },
    },
  });

  return {
    category,
    products: products.map((product) => ({
      ...product,
      price: Number(product.price),
    })),
    total: category._count?.products || 0,
  };
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category || !category.isActive) {
    return buildMetadata({
      title: 'التصنيف غير موجود',
      description: 'هذا التصنيف غير متاح حالياً.',
    });
  }

  return buildMetadata(generateCategoryMetadata(category));
}

export default async function CategorySlugPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await fetchCategoryDetail(slug);
  if (!data) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'الرئيسية', url: '/' },
    { name: 'كل الفئات', url: '/categories' },
    { name: data.category.nameAr || data.category.name, url: `/categories/${data.category.slug}` },
  ];

  const categoryJsonLd = generateCategoryJsonLd(data.category);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const itemListJsonLd = generateItemListJsonLd(
    data.products.map((product) => ({
      name: product.titleAr || product.title,
      url: `/products/${product.slug}`,
      image: product.images[0]?.url || null,
    })),
    `/categories/${data.category.slug}`
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <CategoryDetailClient 
        initialData={{
          category: {
            id: data.category.id,
            name: data.category.name,
            nameAr: data.category.nameAr,
            slug: data.category.slug,
            children: data.category.children.map((child) => ({
              id: child.id,
              name: child.name,
              nameAr: child.nameAr,
              slug: child.slug,
              children: [],
            })),
          },
          products: data.products,
          total: data.total,
        }} 
        slug={slug} 
      />
    </>
  );
}
