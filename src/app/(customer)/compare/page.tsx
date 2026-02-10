import { generateBreadcrumbJsonLd } from '@/lib/seo';
import CompareClient from './CompareClient';

export default function ComparePage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'الرئيسية', url: '/' },
    { name: 'المقارنة', url: '/compare' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CompareClient />
    </>
  );
}
