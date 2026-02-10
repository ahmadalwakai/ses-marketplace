import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute
const AUTH_RATE_LIMIT_MAX = 20; // 20 auth requests per minute

function checkRateLimit(
  map: Map<string, { count: number; resetTime: number }>,
  ip: string,
  max: number
): boolean {
  const now = Date.now();
  const record = map.get(ip);
  
  if (!record || now > record.resetTime) {
    map.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= max) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/auth') && !checkRateLimit(authRateLimitMap, ip, AUTH_RATE_LIMIT_MAX)) {
    return NextResponse.json(
      { success: false, error: 'Too many auth requests. Please try again later.' },
      { status: 429 }
    );
  }

  if (pathname.startsWith('/api') && !checkRateLimit(rateLimitMap, ip, RATE_LIMIT_MAX)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }
  
  const token = await getToken({ req: request, secret });
  
  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/products',
    '/categories',
    '/stores',
    '/sellers',
    '/search',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/ses-live',
    '/small-business',
    '/login',
    '/saved',
  ];
  
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Public API routes (don't need auth)
  const publicApiRoutes = [
    '/api/health',
    '/api/robots',
    '/api/sitemap',
    '/api/auth',
    '/api/categories',
    '/api/products',
    '/api/stores',
    '/api/search',
    '/api/reviews/product',
    '/api/live-streams',
  ];
  
  const isPublicApiRoute = publicApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(route)
  );
  
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isStaticRoute = pathname.startsWith('/_next') || pathname.includes('.');
  
  // Allow static files
  if (isStaticRoute) {
    return NextResponse.next();
  }
  
  // Handle API routes
  if (isApiRoute) {
    // Allow public API routes
    if (isPublicApiRoute) {
      return NextResponse.next();
    }
    
    // Protected API routes need authentication
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Role-based API protection
    const role = token.role as string;
    
    if (pathname.startsWith('/api/admin') && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    if (pathname.startsWith('/api/seller') && !['SELLER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Seller access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.next();
  }
  
  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Redirect to login if not authenticated
  if (!token && !isAuthRoute) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Redirect away from auth pages if already authenticated
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Role-based route protection (coarse-grained)
  if (token) {
    const role = token.role as string;
    
    // Admin routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Seller routes
    if (pathname.startsWith('/seller') && !['SELLER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export const config = {
  matcher: [
    // Protected page routes
    '/dashboard/:path*',
    '/seller/:path*',
    '/admin/:path*',
    // Protected API routes
    '/api/orders/:path*',
    '/api/seller/:path*',
    '/api/admin/:path*',
    '/api/disputes/:path*',
    '/api/reviews/create',
    '/api/uploads/:path*',
    '/api/ai/:path*',
    // Auth routes (for redirect logic)
    '/auth/:path*',
    // Public routes (still need to pass through for security headers)
    '/',
    '/products/:path*',
    '/categories/:path*',
    '/stores/:path*',
    '/sellers/:path*',
    '/search/:path*',
    '/ses-live/:path*',
    '/small-business/:path*',
    '/login',
    '/saved/:path*',
    // API routes for rate limiting
    '/api/:path*',
  ],
};
