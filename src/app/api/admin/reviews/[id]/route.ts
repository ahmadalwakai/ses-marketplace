import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { updateReviewStatusSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status } = updateReviewStatusSchema.parse(body);
    
    const review = await prisma.review.findUnique({
      where: { id },
    });
    
    if (!review) {
      return error('المراجعة غير موجودة', 'REVIEW_NOT_FOUND', 404);
    }
    
    const previousStatus = review.status;
    
    // Update review and potentially product rating
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      // Approve review and update product rating
      await prisma.$transaction(async (tx) => {
        await tx.review.update({
          where: { id },
          data: { status },
        });
        
        // Recalculate product rating
        const ratings = await tx.review.aggregate({
          where: {
            productId: review.productId,
            status: 'APPROVED',
          },
          _avg: { rating: true },
          _count: true,
        });
        
        await tx.product.update({
          where: { id: review.productId },
          data: {
            ratingAvg: ratings._avg.rating || 0,
            ratingCount: ratings._count,
          },
        });
        
        // Also update seller rating
        const product = await tx.product.findUnique({
          where: { id: review.productId },
          select: { sellerId: true },
        });
        
        if (product) {
          const sellerRatings = await tx.review.aggregate({
            where: {
              product: { sellerId: product.sellerId },
              status: 'APPROVED',
            },
            _avg: { rating: true },
            _count: true,
          });
          
          await tx.sellerProfile.update({
            where: { id: product.sellerId },
            data: {
              ratingAvg: sellerRatings._avg.rating || 0,
              ratingCount: sellerRatings._count,
            },
          });
        }
      });
    } else if (status === 'HIDDEN' && previousStatus === 'APPROVED') {
      // Hide review and recalculate product rating
      await prisma.$transaction(async (tx) => {
        await tx.review.update({
          where: { id },
          data: { status },
        });
        
        // Recalculate product rating
        const ratings = await tx.review.aggregate({
          where: {
            productId: review.productId,
            status: 'APPROVED',
          },
          _avg: { rating: true },
          _count: true,
        });
        
        await tx.product.update({
          where: { id: review.productId },
          data: {
            ratingAvg: ratings._avg.rating || 0,
            ratingCount: ratings._count,
          },
        });
      });
    } else {
      // Simple status update
      await prisma.review.update({
        where: { id },
        data: { status },
      });
    }
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'MODERATE_REVIEW',
        entityType: 'Review',
        entityId: id,
        metadata: { previousStatus, newStatus: status },
      },
    });
    
    return success({ id, status, previousStatus });
  } catch (err) {
    return handleError(err);
  }
}
