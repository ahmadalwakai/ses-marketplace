import prisma from '@/lib/prisma';
import type { Product, SellerProfile, Category } from '@prisma/client';
import { getBaseUrl } from '@/lib/url/baseUrl';

const SITE_URL = getBaseUrl();
const SITE_NAME = 'سوريا للتسوق الإلكتروني';

// ============================================
// JSON-LD SCHEMAS
// ============================================

export function generateProductJsonLd(
  product: Product & {
    seller: SellerProfile;
    category: Category | null;
    images: { url: string }[];
  }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.titleAr || product.title,
    description: product.descriptionAr || product.description,
    image: product.images.map(img => img.url),
    sku: product.id,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price.toString(),
      itemCondition: getSchemaCondition(product.condition),
      availability: product.quantity > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: product.seller.storeName,
        url: `${SITE_URL}/stores/${product.seller.slug}`,
      },
    },
    aggregateRating: product.ratingCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAvg.toFixed(1),
      ratingCount: product.ratingCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

function getSchemaCondition(condition: string): string {
  const conditions: Record<string, string> = {
    NEW: 'https://schema.org/NewCondition',
    LIKE_NEW: 'https://schema.org/UsedCondition',
    GOOD: 'https://schema.org/UsedCondition',
    FAIR: 'https://schema.org/UsedCondition',
    POOR: 'https://schema.org/UsedCondition',
  };
  return conditions[condition] || 'https://schema.org/NewCondition';
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function generateItemListJsonLd(
  items: { name: string; url: string; image?: string | null }[],
  pageUrl: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      name: item.name,
      image: item.image
        ? (item.image.startsWith('http') ? item.image : `${SITE_URL}${item.image}`)
        : undefined,
    })),
    url: pageUrl.startsWith('http') ? pageUrl : `${SITE_URL}${pageUrl}`,
  };
}

export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['ar', 'en'],
    },
  };
}

export function generateStoreJsonLd(
  store: SellerProfile & {
    user?: { name: string | null };
    _count?: { products: number };
  }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.storeName,
    description: store.bio || `متجر ${store.storeName} - سوريا للتسوق الإلكتروني`,
    url: `${SITE_URL}/stores/${store.slug}`,
    aggregateRating: store.ratingCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: store.ratingAvg.toFixed(1),
      ratingCount: store.ratingCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

export function generateCategoryJsonLd(
  category: Category & {
    _count?: { products: number };
    children?: Category[];
  }
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.nameAr || category.name,
    url: `${SITE_URL}/categories/${category.slug}`,
    description: `تسوق أفضل منتجات ${category.nameAr || category.name} في سوريا`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ============================================
// SITEMAP GENERATION
// ============================================

export async function generateSitemap(): Promise<string> {
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/products', priority: 0.9, changefreq: 'hourly' },
    { url: '/categories', priority: 0.8, changefreq: 'weekly' },
    { url: '/stores', priority: 0.7, changefreq: 'daily' },
    { url: '/about', priority: 0.5, changefreq: 'monthly' },
    { url: '/contact', priority: 0.5, changefreq: 'monthly' },
  ];
  
  // Fetch dynamic pages
  const [products, categories, sellers] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
      take: 10000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.sellerProfile.findMany({
      where: { verificationStatus: 'APPROVED' },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  
  const urls: string[] = [];
  
  // Add static pages
  for (const page of staticPages) {
    urls.push(`
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }
  
  // Add products
  for (const product of products) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
  }
  
  // Add categories
  for (const category of categories) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/categories/${category.slug}</loc>
    <lastmod>${category.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }
  
  // Add sellers
  for (const seller of sellers) {
    urls.push(`
  <url>
    <loc>${SITE_URL}/stores/${seller.slug}</loc>
    <lastmod>${seller.updatedAt.toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;
}

// ============================================
// ROBOTS.TXT GENERATION
// ============================================

export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /seller/
Disallow: /auth/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

// ============================================
// METADATA HELPERS
// ============================================

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export function generateMetadata(meta: PageMetadata) {
  const fullTitle = `${meta.title} | ${SITE_NAME}`;
  const image = meta.image || `${SITE_URL}/og-image.png`;
  const url = meta.url || SITE_URL;
  
  return {
    title: fullTitle,
    description: meta.description,
    keywords: meta.keywords?.join(', '),
    openGraph: {
      title: fullTitle,
      description: meta.description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630 }],
      locale: 'ar_SY',
      type: meta.type || 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: meta.description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateProductMetadata(
  product: Product & { 
    seller: SellerProfile;
    images: { url: string }[];
  }
): PageMetadata {
  return {
    title: product.titleAr || product.title,
    description: (product.descriptionAr || product.description).slice(0, 160),
    keywords: [
      ...(product.tags as string[] || []),
      product.brand,
      product.seller.storeName,
    ].filter(Boolean) as string[],
    image: product.images[0]?.url,
    url: `${SITE_URL}/products/${product.slug}`,
    type: 'product',
  };
}

export function generateCategoryMetadata(category: Category): PageMetadata {
  return {
    title: category.nameAr || category.name,
    description: `تسوق أفضل منتجات ${category.nameAr || category.name} في سوريا. أسعار منافسة وجودة عالية.`,
    keywords: [category.nameAr || category.name, 'تسوق', 'سوريا'],
    url: `${SITE_URL}/categories/${category.slug}`,
  };
}

export function generateSellerMetadata(seller: SellerProfile): PageMetadata {
  return {
    title: seller.storeName,
    description: seller.bio || `متجر ${seller.storeName} - تسوق أفضل المنتجات`,
    keywords: [seller.storeName, 'متجر', 'سوريا'],
    url: `${SITE_URL}/stores/${seller.slug}`,
  };
}
