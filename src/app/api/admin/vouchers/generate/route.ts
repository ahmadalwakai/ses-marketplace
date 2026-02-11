import { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, error as apiError, handleError } from '@/lib/api-response';
import { generateVoucherCode, hashVoucherCode, codeLast4 } from '@/lib/voucher';

const generateSchema = z.object({
  count: z.number().int().min(1).max(5000),
  value: z.number().positive().refine(
    (v) => Number.isFinite(v) && Math.round(v * 100) === v * 100,
    { message: 'Value must have at most 2 decimal places' }
  ),
  currency: z.string().min(1).max(10).default('USD'),
  expiresAt: z.string().datetime().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  batchName: z.string().max(200).nullable().optional(),
  distributorName: z.string().max(200).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON body', 'VALIDATION_ERROR', 400);
    }
    const { count, value, currency, expiresAt, note, batchName, distributorName } = generateSchema.parse(body);

    // Use Prisma Decimal for precise monetary values
    const decimalValue = new Prisma.Decimal(value.toFixed(2));

    // Auto-create batch if batchName provided
    let batchId: string | null = null;
    if (batchName?.trim()) {
      const batch = await prisma.voucherBatch.create({
        data: {
          name: batchName.trim(),
          createdByAdminId: admin.id,
        },
      });
      batchId = batch.id;
    }

    const rawCodes: string[] = [];
    const voucherData: Prisma.VoucherCardCreateManyInput[] = [];
    const existingHashes = new Set<string>();
    let dbCollisionRetries = 0;
    const MAX_DB_COLLISION_RETRIES = count * 3; // safety cap

    for (let i = 0; i < count; i++) {
      let code: string;
      let hash: string;
      let localAttempts = 0;
      const MAX_LOCAL_RETRIES = 10;

      // Generate unique code with local collision retry
      do {
        code = generateVoucherCode();
        hash = hashVoucherCode(code);
        localAttempts++;
        if (localAttempts > MAX_LOCAL_RETRIES) {
          throw new Error('Failed to generate unique voucher code after max retries');
        }
      } while (existingHashes.has(hash));

      // Also check DB for existing hash
      const existing = await prisma.voucherCard.findUnique({
        where: { codeHash: hash },
        select: { id: true },
      });

      if (existing) {
        dbCollisionRetries++;
        if (dbCollisionRetries > MAX_DB_COLLISION_RETRIES) {
          throw new Error('Too many DB collisions during voucher generation');
        }
        i--;
        continue;
      }

      existingHashes.add(hash);
      rawCodes.push(code);
      voucherData.push({
        codeHash: hash,
        codeLast4: codeLast4(code),
        value: decimalValue,
        currency,
        status: 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdByAdminId: admin.id,
        note: note ?? null,
        batchId,
        distributorName: distributorName?.trim() || null,
      });
    }

    // Batch insert all vouchers
    await prisma.voucherCard.createMany({
      data: voucherData,
    });

    return success({
      generated: rawCodes.length,
      codes: rawCodes,
      warning: 'These codes will NOT be shown again. Download them now.',
    });
  } catch (err) {
    return handleError(err);
  }
}
