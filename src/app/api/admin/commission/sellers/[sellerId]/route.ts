import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateSellerCommissionSchema = z.object({
  tier: z.enum(['STANDARD', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'CUSTOM']).optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ sellerId: string }>;
}

/**
 * PATCH /api/admin/commission/sellers/[sellerId]
 * Update a seller commission override
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { sellerId } = await params;
    const body = await request.json();
    const data = updateSellerCommissionSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const commission = await prisma.sellerCommission.update({
      where: { sellerId },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            verificationStatus: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_SELLER_COMMISSION',
        entityType: 'SellerCommission',
        entityId: commission.id,
        metadata: { sellerId, changes: data },
      },
    });
    
    return success(commission);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/admin/commission/sellers/[sellerId]
 * Remove a seller commission override (revert to global rate)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { sellerId } = await params;
    
    const commission = await prisma.sellerCommission.findUnique({
      where: { sellerId },
    });
    
    if (!commission) {
      return handleError(new Error('تجاوز العمولة غير موجود'));
    }
    
    await prisma.sellerCommission.delete({
      where: { sellerId },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_SELLER_COMMISSION',
        entityType: 'SellerCommission',
        entityId: commission.id,
        metadata: { sellerId },
      },
    });
    
    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
