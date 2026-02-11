import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';
import { hashVoucherCode } from '@/lib/voucher';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

const redeemSchema = z.object({
  code: z
    .string()
    .min(8, 'Voucher code must be at least 8 characters')
    .max(64, 'Voucher code must be at most 64 characters')
    .transform((v) => v.trim().toUpperCase()),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Rate limiting by IP + user — checked BEFORE any DB work
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    const ipKey = `voucher-redeem:ip:${ip}`;
    const userKey = `voucher-redeem:user:${user.id}`;

    const ipCheck = checkRateLimit(ipKey);
    if (!ipCheck.allowed) {
      return error(
        `Too many attempts. Try again in ${Math.ceil((ipCheck.retryAfterMs ?? 0) / 60000)} minutes.`,
        'RATE_LIMITED',
        429
      );
    }

    const userCheck = checkRateLimit(userKey);
    if (!userCheck.allowed) {
      return error(
        `Too many attempts. Try again in ${Math.ceil((userCheck.retryAfterMs ?? 0) / 60000)} minutes.`,
        'RATE_LIMITED',
        429
      );
    }

    const body = await req.json();
    const { code } = redeemSchema.parse(body);

    let codeHash: string;
    try {
      codeHash = hashVoucherCode(code);
    } catch {
      return error('Voucher system is temporarily unavailable', 'SERVICE_ERROR', 500);
    }

    // All logic inside a serializable transaction to prevent double-redeem
    const result = await prisma.$transaction(async (tx) => {
      // Lookup voucher inside the transaction for race-safety
      const voucher = await tx.voucherCard.findUnique({
        where: { codeHash },
      });

      if (!voucher) {
        return { error: 'INVALID_CODE' as const };
      }

      if (voucher.status === 'USED') {
        return { error: 'VOUCHER_USED' as const };
      }

      if (voucher.status === 'DISABLED') {
        return { error: 'VOUCHER_DISABLED' as const };
      }

      if (voucher.status === 'EXPIRED') {
        return { error: 'VOUCHER_EXPIRED' as const };
      }

      if (voucher.expiresAt && new Date() > voucher.expiresAt) {
        await tx.voucherCard.update({
          where: { id: voucher.id },
          data: { status: 'EXPIRED' },
        });
        return { error: 'VOUCHER_EXPIRED' as const };
      }

      // Atomically mark voucher USED only if still ACTIVE (prevents double-redeem)
      const updated = await tx.voucherCard.updateMany({
        where: { id: voucher.id, status: 'ACTIVE' },
        data: {
          status: 'USED',
          usedAt: new Date(),
          usedByUserId: user.id,
        },
      });

      if (updated.count === 0) {
        // Another request redeemed it between our read and write
        return { error: 'VOUCHER_USED' as const };
      }

      // Increment user wallet balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: {
            increment: voucher.value,
          },
        },
        select: { walletBalance: true, walletCurrency: true },
      });

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'CREDIT',
          amount: voucher.value,
          currency: voucher.currency,
          reason: 'VOUCHER_REDEEM',
          referenceId: voucher.id,
        },
      });

      return {
        error: null,
        transactionId: transaction.id,
        creditedAmount: Number(voucher.value),
        currency: voucher.currency,
        walletBalance: Number(updatedUser.walletBalance),
        walletCurrency: updatedUser.walletCurrency,
      };
    });

    // Handle errors returned from inside the transaction
    if (result.error) {
      const errorMap: Record<string, { msg: string; status: number }> = {
        INVALID_CODE: { msg: 'Invalid voucher code', status: 400 },
        VOUCHER_USED: { msg: 'This voucher has already been used', status: 400 },
        VOUCHER_DISABLED: { msg: 'This voucher has been disabled', status: 400 },
        VOUCHER_EXPIRED: { msg: 'This voucher has expired', status: 400 },
      };
      const e = errorMap[result.error];
      return error(e.msg, result.error, e.status);
    }

    // Reset rate limiter on success
    resetRateLimit(ipKey);
    resetRateLimit(userKey);

    return success({
      transactionId: result.transactionId,
      creditedAmount: result.creditedAmount,
      currency: result.currency,
      walletBalance: result.walletBalance,
      walletCurrency: result.walletCurrency,
    });
  } catch (err) {
    return handleError(err);
  }
}
