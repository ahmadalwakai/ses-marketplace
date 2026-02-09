import { NextRequest } from 'next/server';
import prisma, { createAuditLog, notifyAdmins } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { productModerationSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { recomputeProductScore } from '@/lib/ranking';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdminActive();
    const { id } = await params;
    const body = await request.json();
    const data = productModerationSchema.parse(body);
    
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'PRODUCT_NOT_FOUND', 404);
    }
    
    // Update product
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        ...(data.manualBoost !== undefined && { manualBoost: data.manualBoost }),
        ...(data.penaltyScore !== undefined && { penaltyScore: data.penaltyScore }),
      },
    });
    
    // Recompute score
    await recomputeProductScore(id);
    
    // Log action
    await createAuditLog({
      adminId: admin.id,
      action: 'MODERATE_PRODUCT',
      entityType: 'Product',
      entityId: id,
      metadata: {
        changes: data,
        previousStatus: product.status,
      },
    });
    
    // Fetch updated product with new score
    const final = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        pinned: true,
        manualBoost: true,
        penaltyScore: true,
        score: true,
      },
    });
    
    return success(final);
  } catch (err) {
    return handleError(err);
  }
}
