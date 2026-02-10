import { generateBreadcrumbJsonLd } from '@/lib/seo';
import SellersClient from './SellersClient';

export default function SellersPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'الرئيسية', url: '/' },
    { name: 'المتاجر', url: '/sellers' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SellersClient />
    </>
  );
}
