import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { recomputeAllScores } from '@/lib/ranking';

export async function PATCH() {
  try {
    const admin = await requireAdmin();
    
    // Run recompute in batches
    const updated = await recomputeAllScores(100);
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'RECOMPUTE_RANKINGS',
        entityType: 'Product',
        entityId: 'batch',
        metadata: { productsUpdated: updated },
      },
    });
    
    return success({
      message: `تم تحديث ترتيب ${updated} منتج`,
      productsUpdated: updated,
    });
  } catch (err) {
    return handleError(err);
  }
}
