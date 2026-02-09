import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateCategoryCommissionSchema = z.object({
  commissionRate: z.number().min(0).max(1),
});

interface RouteParams {
  params: Promise<{ categoryId: string }>;
}

/**
 * PATCH /api/admin/commission/categories/[categoryId]
 * Update a category commission override
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { categoryId } = await params;
    const body = await request.json();
    const data = updateCategoryCommissionSchema.parse(body);
    
    const commission = await prisma.categoryCommission.update({
      where: { categoryId },
      data: { commissionRate: data.commissionRate },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
      },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_CATEGORY_COMMISSION',
        entityType: 'CategoryCommission',
        entityId: commission.id,
        metadata: { categoryId, commissionRate: data.commissionRate },
      },
    });
    
    return success(commission);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/admin/commission/categories/[categoryId]
 * Remove a category commission override (revert to global rate)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { categoryId } = await params;
    
    const commission = await prisma.categoryCommission.findUnique({
      where: { categoryId },
    });
    
    if (!commission) {
      return handleError(new Error('تجاوز العمولة غير موجود'));
    }
    
    await prisma.categoryCommission.delete({
      where: { categoryId },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'DELETE_CATEGORY_COMMISSION',
        entityType: 'CategoryCommission',
        entityId: commission.id,
        metadata: { categoryId },
      },
    });
    
    return success({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}
