import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { handleError } from '@/lib/api-response';
import { paginationMeta, paginated } from '@/lib/api-response';
import type { VoucherStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const status = url.searchParams.get('status') as VoucherStatus | null;
    const batchId = url.searchParams.get('batchId');
    const take = Math.min(Math.max(parseInt(url.searchParams.get('take') ?? '20', 10) || 20, 1), 100);
    const skip = Math.max(parseInt(url.searchParams.get('skip') ?? '0', 10) || 0, 0);

    const where: Record<string, unknown> = {};
    if (status && ['ACTIVE', 'USED', 'DISABLED', 'EXPIRED'].includes(status)) {
      where.status = status;
    }
    if (batchId) {
      where.batchId = batchId;
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucherCard.findMany({
        where,
        select: {
          id: true,
          codeLast4: true,
          value: true,
          currency: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          usedAt: true,
          note: true,
          distributorName: true,
          usedBy: {
            select: {
              email: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              email: true,
              name: true,
            },
          },
          batch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.voucherCard.count({ where }),
    ]);

    const page = Math.floor(skip / take) + 1;
    const meta = paginationMeta(page, take, total);

    const items = vouchers.map((v) => ({
      id: v.id,
      codeLast4: v.codeLast4,
      value: Number(v.value),
      currency: v.currency,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
      expiresAt: v.expiresAt?.toISOString() ?? null,
      usedAt: v.usedAt?.toISOString() ?? null,
      note: v.note,
      distributorName: v.distributorName,
      batchId: v.batch?.id ?? null,
      batchName: v.batch?.name ?? null,
      usedByEmail: v.usedBy?.email ?? null,
      usedByName: v.usedBy?.name ?? null,
      createdByEmail: v.createdBy?.email ?? null,
    }));

    return paginated(items, meta);
  } catch (err) {
    return handleError(err);
  }
}
