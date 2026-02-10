import { generateBreadcrumbJsonLd } from '@/lib/seo';
import SavedClient from './SavedClient';

export default function SavedPage() {
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'الرئيسية', url: '/' },
    { name: 'المحفوظات', url: '/saved' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SavedClient />
    </>
  );
}
