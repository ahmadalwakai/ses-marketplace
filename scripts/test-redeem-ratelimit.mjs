#!/usr/bin/env node
// =============================================================
// Rate-limit smoke-test: 6 rapid invalid code redeems
// Expected: first 5 get normal 400 errors, 6th gets 429 lockout
//
// Usage:
//   1. Start the dev server: npm run dev
//   2. Get your session cookie from browser DevTools
//   3. Run:
//        node scripts/test-redeem-ratelimit.mjs <SESSION_COOKIE_VALUE>
//
//   Example:
//        node scripts/test-redeem-ratelimit.mjs "eyJhbGciO..."
// =============================================================

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SESSION_COOKIE = process.argv[2];

if (!SESSION_COOKIE) {
  console.error('Usage: node scripts/test-redeem-ratelimit.mjs <SESSION_COOKIE_VALUE>');
  process.exit(1);
}

const COOKIE_NAME = process.env.COOKIE_NAME || 'authjs.session-token';
const INVALID_CODE = 'ZZZZZZZZZZZZZZZZ'; // guaranteed to not exist

async function redeem(index) {
  try {
    const res = await fetch(`${BASE}/api/vouchers/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${SESSION_COOKIE}`,
      },
      body: JSON.stringify({ code: INVALID_CODE }),
    });
    const data = await res.json();
    return { index, status: res.status, code: data.error?.code ?? 'OK' };
  } catch (err) {
    return { index, status: 0, code: err.message };
  }
}

console.log(`\n🔄 Sending 6 sequential invalid redeem requests...`);
console.log(`   Base URL: ${BASE}`);
console.log(`   Cookie: ${COOKIE_NAME}=<redacted>\n`);

let gotLockout = false;

// Sequential — rate limiter counts per-request
for (let i = 0; i < 6; i++) {
  const r = await redeem(i);
  const label = r.status === 429 ? '🔒 RATE LIMITED' : `HTTP ${r.status} (${r.code})`;
  console.log(`  Request #${i + 1}: ${label}`);

  if (r.status === 429) {
    gotLockout = true;
  }
}

console.log('');
if (gotLockout) {
  console.log('✅ PASS — rate limiter kicked in and returned 429');
} else {
  console.log('🚨 FAIL — no 429 received after 6 attempts. Rate limiter may not be working.');
}

// Also test that a 7th attempt is still locked
const extra = await redeem(6);
if (extra.status === 429) {
  console.log('✅ PASS — subsequent request is still locked out');
} else {
  console.log(`⚠️  Request #7 returned HTTP ${extra.status} — expected 429`);
}
