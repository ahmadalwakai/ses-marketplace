// ============================================
// IN-MEMORY RATE LIMITER (no external dependency)
// ============================================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const store = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check rate limit for a given key (IP or userId).
 * Returns { allowed: true } if under limit, or { allowed: false, retryAfterMs } if locked out.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return { allowed: true };
  }

  // If currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  // If lock expired or window expired, reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    store.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return { allowed: true };
  }

  // If window has passed, reset
  if (now - entry.firstAttempt > WINDOW_MS) {
    store.set(key, { count: 1, firstAttempt: now, lockedUntil: null });
    return { allowed: true };
  }

  // Increment
  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  return { allowed: true };
}

/**
 * Record a successful attempt, resetting the counter for the key.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

// Periodic cleanup of stale entries every 15 minutes
if (typeof globalThis !== 'undefined') {
  const CLEANUP_INTERVAL = 15 * 60 * 1000;
  const globalStore = globalThis as unknown as { _rateLimitCleanup?: NodeJS.Timeout };
  if (!globalStore._rateLimitCleanup) {
    globalStore._rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        const expiry = entry.lockedUntil ?? entry.firstAttempt + WINDOW_MS;
        if (now > expiry) {
          store.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);
    // Don't block Node.js from exiting
    if (globalStore._rateLimitCleanup.unref) {
      globalStore._rateLimitCleanup.unref();
    }
  }
}
