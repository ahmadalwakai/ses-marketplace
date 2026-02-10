/**
 * Centralized base URL resolver for the application.
 *
 * Priority:
 *   1. APP_URL          (explicit production override)
 *   2. NEXT_PUBLIC_APP_URL (client-accessible fallback)
 *   3. Hard-coded production default
 *
 * NEXTAUTH_URL is intentionally NOT used here — that env var belongs to
 * NextAuth and may contain localhost during development.
 */

const PRODUCTION_URL = 'https://www.ses-marketplace.com';

/**
 * Returns the canonical base URL for the application (no trailing slash).
 *
 * In production, throws if the resolved URL points to localhost / 127.0.0.1
 * so that dev URLs can never leak into emails or public links.
 */
export function getBaseUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PRODUCTION_URL;

  // Strip trailing slashes
  const base = raw.replace(/\/+$/, '');

  // Safety guard: never allow localhost in production
  if (
    process.env.NODE_ENV === 'production' &&
    (base.includes('localhost') || base.includes('127.0.0.1'))
  ) {
    throw new Error(
      `[getBaseUrl] Resolved URL "${base}" contains localhost — ` +
        'this is not allowed in production. Set APP_URL to the production domain.'
    );
  }

  return base;
}

/**
 * Build a full absolute URL from a path.
 *
 * @example absoluteUrl('/admin')          → 'https://www.ses-marketplace.com/admin'
 * @example absoluteUrl('/auth/login')     → 'https://www.ses-marketplace.com/auth/login'
 * @example absoluteUrl('')                → 'https://www.ses-marketplace.com'
 */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  if (!path || path === '/') return base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
