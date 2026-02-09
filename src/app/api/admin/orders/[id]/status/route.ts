import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { updateOrderStatusSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendOrderStatusUpdateEmail } from '@/lib/email/resend';

interface Props {
  params: Promise<{ id: string }>;
}

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
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status: newStatus } = updateOrderStatusSchema.parse(body);
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, email: true } },
        items: true,
      },
    });
    
    if (!order) {
      return error('الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
    }
    
    const previousStatus = order.status;
    
    // Admin can make any status transition
    // Handle cancellation - restore stock
    if (newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { increment: item.qty } },
          });
        }
        await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
    }
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'Order',
        entityId: id,
        metadata: { previousStatus, newStatus },
      },
    });
    
    // Notify customer
    sendOrderStatusUpdateEmail(
      order.customer.email,
      order.id,
      newStatus,
      STATUS_LABELS[newStatus]
    ).catch(console.error);
    
    return success({
      id: order.id,
      previousStatus,
      newStatus,
      message: `تم تحديث الحالة إلى "${STATUS_LABELS[newStatus]}"`,
    });
  } catch (err) {
    return handleError(err);
  }
}
