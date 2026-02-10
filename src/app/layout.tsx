import type { Metadata } from 'next';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import CookieConsent from '@/components/CookieConsent';
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('ses-color-mode');if(m==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
