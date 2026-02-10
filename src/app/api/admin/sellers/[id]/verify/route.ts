import { NextRequest } from 'next/server';
import prisma, { createAuditLog } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';
import { z } from 'zod';

const verifySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  level: z.enum(['BASIC', 'VERIFIED', 'PREMIUM', 'TOP_RATED']).optional(),
});

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdminActive();
    const { id } = await params;
    const body = await request.json();
    const { status, level } = verifySchema.parse(body);

    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, verificationStatus: true, verificationLevel: true },
    });

    if (!seller) {
      return error('البائع غير موجود', 'SELLER_NOT_FOUND', 404);
    }

    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: {
        verificationStatus: status,
        ...(level ? { verificationLevel: level } : {}),
      },
      select: {
        id: true,
        verificationStatus: true,
        verificationLevel: true,
      },
    });

    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: seller.userId },
        data: { status: 'ACTIVE' },
      });
    }

    await createAuditLog({
      adminId: admin.id,
      action: 'VERIFY_SELLER',
      entityType: 'SellerProfile',
      entityId: id,
      metadata: {
        previousStatus: seller.verificationStatus,
        previousLevel: seller.verificationLevel,
        newStatus: status,
        newLevel: level || seller.verificationLevel,
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
