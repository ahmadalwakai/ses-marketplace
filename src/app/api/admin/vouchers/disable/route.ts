import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';

const disableSchema = z.object({
  voucherId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { voucherId } = disableSchema.parse(body);

    const voucher = await prisma.voucherCard.findUnique({
      where: { id: voucherId },
      select: { id: true, status: true },
    });

    if (!voucher) {
      return error('Voucher not found', 'NOT_FOUND', 404);
    }

    if (voucher.status === 'USED') {
      return error('Cannot disable a voucher that has already been used', 'ALREADY_USED', 400);
    }

    if (voucher.status === 'DISABLED') {
      return error('Voucher is already disabled', 'ALREADY_DISABLED', 400);
    }

    const updated = await prisma.voucherCard.update({
      where: { id: voucherId },
      data: { status: 'DISABLED' },
      select: { id: true, status: true, codeLast4: true },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
