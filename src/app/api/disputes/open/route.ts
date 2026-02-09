import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomer } from '@/lib/rbac';
import { openDisputeSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendDisputeOpenedEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomer();
    const body = await request.json();
    const data = openDisputeSchema.parse(body);
    
    // Validate order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: {
        seller: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });
    
    if (!order) {
      return error('الطلب غير موجود', 'ORDER_NOT_FOUND', 404);
    }
    
    if (order.customerId !== user.id) {
      return error('ليس لديك صلاحية لفتح نزاع على هذا الطلب', 'FORBIDDEN', 403);
    }
    
    // Can't dispute cancelled or resolved orders
    if (['CANCELLED', 'RESOLVED'].includes(order.status)) {
      return error('لا يمكن فتح نزاع على طلب ملغي أو محلول', 'INVALID_ORDER_STATUS', 400);
    }
    
    // Check for existing dispute
    const existingDispute = await prisma.dispute.findUnique({
      where: { orderId: data.orderId },
    });
    
    if (existingDispute) {
      return error('يوجد نزاع مفتوح بالفعل على هذا الطلب', 'DISPUTE_EXISTS', 400);
    }
    
    // Create dispute and update order status
    const [dispute] = await prisma.$transaction([
      prisma.dispute.create({
        data: {
          orderId: data.orderId,
          openedById: user.id,
          reason: data.reason,
          status: 'OPEN',
        },
      }),
      prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'DISPUTED' },
      }),
    ]);
    
    // Send emails (non-blocking)
    const customerUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    
    if (customerUser) {
      sendDisputeOpenedEmail(
        customerUser.email,
        dispute.id,
        order.id,
        data.reason
      ).catch(console.error);
    }
    
    sendDisputeOpenedEmail(
      order.seller.user.email,
      dispute.id,
      order.id,
      data.reason
    ).catch(console.error);
    
    // In-app notification to seller
    const sellerUser = await prisma.user.findFirst({
      where: { sellerProfile: { id: order.sellerId } },
      select: { id: true },
    });
    if (sellerUser) {
      prisma.notification.create({
        data: {
          userId: sellerUser.id,
          type: 'DISPUTE_OPENED',
          title: 'نزاع جديد',
          message: `تم فتح نزاع على الطلب #${order.id.slice(-8)}`,
          link: `/seller/orders`,
        },
      }).catch(console.error);
    }

    return success(dispute, 201);
  } catch (err) {
    return handleError(err);
  }
}
