import { createHash, randomBytes } from 'crypto';

// ============================================
// VOUCHER CODE HASHING & GENERATION
// ============================================

/**
 * Hash a voucher code using SHA-256 with a server-side pepper.
 * Never store raw codes in the database.
 */
export function hashVoucherCode(code: string): string {
  const pepper = process.env.VOUCHER_CODE_PEPPER;
  if (!pepper) {
    throw new Error('VOUCHER_CODE_PEPPER environment variable is not set');
  }
  return createHash('sha256')
    .update(code.trim().toUpperCase() + pepper)
    .digest('hex');
}

/**
 * Characters used for generating voucher codes.
 * Ambiguous characters (0, O, I, L, 1) are excluded.
 */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a single random voucher code of given length (default 16).
 */
export function generateVoucherCode(length = 16): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

/**
 * Extract last 4 characters from a code for display purposes.
 */
export function codeLast4(code: string): string {
  const normalized = code.trim().toUpperCase();
  return normalized.slice(-4);
}
