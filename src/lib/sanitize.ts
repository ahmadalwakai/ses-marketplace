// Input sanitization utilities

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and entities
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Sanitize user input for display
 * Escapes HTML special characters
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return input.replace(/[&<>"'`=/]/g, (char) => map[char]);
}

/**
 * Sanitize input for database storage
 * Removes potentially dangerous characters while preserving Arabic
 */
export function sanitizeForDb(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize phone number
 * Preserves only digits and common phone characters
 */
export function sanitizePhone(phone: string): string {
  // Allow digits, +, -, spaces, parentheses
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
}

/**
 * Sanitize email
 * Lowercase and trim
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize slug
 * Creates URL-safe slugs
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]+/g, (match) => {
      // Transliterate common Arabic characters
      const arabicMap: Record<string, string> = {
        'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a',
        'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'th',
        'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
        'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
        'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
        'ة': 'h', 'ء': '',
      };
      return match.split('').map(c => arabicMap[c] || c).join('');
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Sanitize search query
 * Removes SQL injection patterns and normalizes whitespace
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/['"`;\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/\/\*/g, '') // Remove SQL block comment start
    .replace(/\*\//g, '') // Remove SQL block comment end
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 200); // Limit length
}

/**
 * Validate and sanitize URL
 * Only allows http/https URLs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize price
 * Ensures positive number with max 2 decimal places
 */
export function sanitizePrice(price: number): number {
  const sanitized = Math.abs(price);
  return Math.round(sanitized * 100) / 100;
}

/**
 * Sanitize integer
 * Ensures positive integer
 */
export function sanitizePositiveInt(value: number): number {
  return Math.max(0, Math.floor(Math.abs(value)));
}

/**
 * Deep sanitize object
 * Recursively sanitizes all string values in an object
 */
export function deepSanitize<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeForDb(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepSanitize(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeForDb(item)
          : item && typeof item === 'object'
          ? deepSanitize(item as Record<string, unknown>)
          : item
      );
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}
