import { NextResponse } from 'next/server';
import { generateSitemap } from '@/lib/seo';

export async function GET() {
  try {
    const sitemap = await generateSitemap();
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
