import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';

const schema = z.object({
  batchId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { batchId } = schema.parse(body);

    const batch = await prisma.voucherBatch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true },
    });

    if (!batch) {
      return error('Batch not found', 'NOT_FOUND', 404);
    }

    // Count vouchers that won't be touched (USED/already DISABLED/EXPIRED)
    const [activeCount, usedCount] = await Promise.all([
      prisma.voucherCard.count({ where: { batchId, status: 'ACTIVE' } }),
      prisma.voucherCard.count({ where: { batchId, status: 'USED' } }),
    ]);

    const result = await prisma.voucherCard.updateMany({
      where: { batchId, status: 'ACTIVE' },
      data: { status: 'DISABLED' },
    });

    return success({
      batchId: batch.id,
      batchName: batch.name,
      disabledCount: result.count,
      skippedUsedCount: usedCount,
      totalActiveBeforeDisable: activeCount,
    });
  } catch (err) {
    return handleError(err);
  }
}
