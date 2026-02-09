import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError, paginationMeta } from '@/lib/api-response';
import { recomputeProductScore } from '@/lib/ranking';
import { z } from 'zod';

const updateRankingSchema = z.object({
  pinned: z.boolean().optional(),
  manualBoost: z.number().min(-10).max(10).optional(),
  penaltyScore: z.number().min(0).max(10).optional(),
});

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * PATCH /api/admin/ranking/products/[productId]
 * Update ranking factors for a product (pin/boost/penalty)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    const { productId } = await params;
    const body = await request.json();
    const data = updateRankingSchema.parse(body);
    
    const updateData: Record<string, unknown> = {};
    if (data.pinned !== undefined) updateData.pinned = data.pinned;
    if (data.manualBoost !== undefined) updateData.manualBoost = data.manualBoost;
    if (data.penaltyScore !== undefined) updateData.penaltyScore = data.penaltyScore;
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        pinned: true,
        manualBoost: true,
        penaltyScore: true,
        score: true,
      },
    });
    
    // Recompute score after changes
    const newScore = await recomputeProductScore(productId);
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_PRODUCT_RANKING',
        entityType: 'Product',
        entityId: productId,
        metadata: { changes: data, newScore },
      },
    });
    
    return success({ ...product, score: newScore });
  } catch (err) {
    return handleError(err);
  }
}
