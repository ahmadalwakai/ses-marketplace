import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { updateOrderStatusSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendOrderStatusUpdateEmail } from '@/lib/email/resend';

interface Props {
  params: Promise<{ id: string }>;
}

// Define valid status transitions for sellers
const SELLER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
  DISPUTED: [], // Only admin can resolve
  RESOLVED: [], // Terminal state
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  PACKING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
  DISPUTED: 'نزاع',
  RESOLVED: 'تم الحل',
};

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = updateOrderStatusSchema.parse(body);
    
    // Get order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, email: true, name: true },
        },
        items: true,
      },
    });
    
    if (!order) {
      return error('الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
    }
    
    // Verify ownership
    if (order.sellerId !== user.sellerId && user.role !== 'ADMIN') {
      return error('ليس لديك صلاحية لتعديل هذا الطلب', 'FORBIDDEN', 403);
    }
    
    // Validate status transition
    const allowedTransitions = SELLER_STATUS_TRANSITIONS[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return error(
        `لا يمكن تغيير الحالة من "${STATUS_LABELS[order.status]}" إلى "${STATUS_LABELS[newStatus]}"`,
        'INVALID_STATUS_TRANSITION',
        400
      );
    }
    
    // Handle cancellation - restore stock
    if (newStatus === 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        // Restore stock for each item
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.qty },
            },
          });
        }
        
        // Update order status
        await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });
      });
    } else {
      // Simple status update
      await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
    }
    
    // Update product rating stats if delivered
    if (newStatus === 'DELIVERED') {
      // This would be a good place to trigger rating recalculation
      // after reviews are submitted
    }
    
    // Send email notification
    sendOrderStatusUpdateEmail(
      order.customer.email,
      order.id,
      newStatus,
      STATUS_LABELS[newStatus]
    ).catch(console.error);
    
    return success({
      id: order.id,
      previousStatus: order.status,
      newStatus,
      message: `تم تحديث الحالة إلى "${STATUS_LABELS[newStatus]}"`,
    });
  } catch (err) {
    return handleError(err);
  }
}
