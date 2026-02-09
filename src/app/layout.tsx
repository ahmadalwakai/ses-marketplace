import type { Metadata } from 'next';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'سوريا للتسوق الإلكتروني | SES',
  description: 'سوق سوري إلكتروني للتسوق - بيع وشراء المنتجات بأمان',
  keywords: ['سوريا', 'تسوق', 'سوق إلكتروني', 'بيع', 'شراء'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
