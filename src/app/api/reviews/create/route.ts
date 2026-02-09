import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomer } from '@/lib/rbac';
import { createReviewSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await request.json();
    const data = createReviewSchema.parse(body);
    
    // Validate order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        items: {
          select: { productId: true },
        },
      },
    });
    
    if (!order) {
      return error('الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
    }
    
    if (order.customerId !== user.id) {
      return error('ليس لديك صلاحية لمراجعة هذا الطلب', 'FORBIDDEN', 403);
    }
    
    // Must be delivered to review
    if (order.status !== 'DELIVERED') {
      return error('يمكنك كتابة مراجعة فقط بعد استلام الطلب', 'ORDER_NOT_DELIVERED', 400);
    }
    
    // Product must be in the order
    const productInOrder = order.items.some((item) => item.productId === data.productId);
    if (!productInOrder) {
      return error('المنتج ليس جزءاً من هذا الطلب', 'PRODUCT_NOT_IN_ORDER', 400);
    }
    
    // Check for existing review
    const existingReview = await prisma.review.findUnique({
      where: {
        orderId_productId_customerId: {
          orderId: data.orderId,
          productId: data.productId,
          customerId: user.id,
        },
      },
    });
    
    if (existingReview) {
      return error('لقد قمت بتقييم هذا المنتج مسبقاً', 'REVIEW_EXISTS', 400);
    }
    
    // Create review
    const review = await prisma.review.create({
      data: {
        orderId: data.orderId,
        productId: data.productId,
        customerId: user.id,
        rating: data.rating,
        comment: data.comment,
        status: 'PENDING', // Reviews need admin approval
      },
    });
    
    return success(review, 201);
  } catch (err) {
    return handleError(err);
  }
}
