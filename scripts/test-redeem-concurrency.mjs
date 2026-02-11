#!/usr/bin/env node
// =============================================================
// Concurrency smoke-test: 10 parallel redeems of the SAME code
// Expected: exactly 1 success, 9 failures
//
// Usage:
//   1. Start the dev server: npm run dev
//   2. Generate a voucher via admin UI or curl, copy one raw code
//   3. Get your session cookie from browser DevTools (Application → Cookies → authjs.session-token or next-auth.session-token)
//   4. Run:
//        node scripts/test-redeem-concurrency.mjs <VOUCHER_CODE> <SESSION_COOKIE_VALUE>
//
//   Example:
//        node scripts/test-redeem-concurrency.mjs ABCD1234EFGH5678 "eyJhbGciO..."
// =============================================================

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const VOUCHER_CODE = process.argv[2];
const SESSION_COOKIE = process.argv[3];

if (!VOUCHER_CODE || !SESSION_COOKIE) {
  console.error('Usage: node scripts/test-redeem-concurrency.mjs <VOUCHER_CODE> <SESSION_COOKIE_VALUE>');
  process.exit(1);
}

// Detect cookie name: NextAuth v5 uses authjs.session-token in prod, next-auth.session-token in dev
const COOKIE_NAME = process.env.COOKIE_NAME || 'authjs.session-token';

async function redeem(index) {
  try {
    const res = await fetch(`${BASE}/api/vouchers/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAME}=${SESSION_COOKIE}`,
      },
      body: JSON.stringify({ code: VOUCHER_CODE }),
    });
    const data = await res.json();
    return { index, status: res.status, ok: data.ok, error: data.error?.code ?? null };
  } catch (err) {
    return { index, status: 0, ok: false, error: err.message };
  }
}

console.log(`\n🔄 Sending 10 parallel redeem requests for code: ${VOUCHER_CODE.slice(0, 4)}****`);
console.log(`   Base URL: ${BASE}`);
console.log(`   Cookie: ${COOKIE_NAME}=<redacted>\n`);

const results = await Promise.all(Array.from({ length: 10 }, (_, i) => redeem(i)));

let successes = 0;
let failures = 0;

for (const r of results) {
  const label = r.ok ? '✅ SUCCESS' : `❌ FAIL (${r.error})`;
  console.log(`  Request #${r.index}: HTTP ${r.status} → ${label}`);
  if (r.ok) successes++;
  else failures++;
}

console.log(`\n📊 Results: ${successes} success, ${failures} failures`);

if (successes === 1 && failures === 9) {
  console.log('✅ PASS — exactly 1 redemption succeeded, double-redeem prevented');
} else if (successes === 0) {
  console.log('⚠️  All failed — check that the voucher code is valid and ACTIVE, and the cookie is correct');
} else if (successes > 1) {
  console.log('🚨 FAIL — multiple redemptions succeeded! Double-redeem bug!');
} else {
  console.log('⚠️  Unexpected result — review output above');
}
