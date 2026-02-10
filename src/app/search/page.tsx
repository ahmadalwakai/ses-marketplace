import { generateBreadcrumbJsonLd } from '@/lib/seo';
import SearchClient from './SearchClient';

export default async function SearchPage(
  { searchParams }: { searchParams: Promise<{ q?: string | string[] }> }
) {
  const params = await searchParams;
  const rawQuery = params?.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  const breadcrumbs = [
    { name: 'الرئيسية', url: '/' },
    { name: 'البحث', url: '/search' },
    ...(query
      ? [{ name: `نتائج البحث: ${query}`, url: `/search?q=${encodeURIComponent(query)}` }]
      : []),
  ];
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SearchClient />
    </>
  );
}
