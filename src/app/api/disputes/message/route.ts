import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { disputeMessageSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = disputeMessageSchema.parse(body);
    
    // Get dispute with order info
    const dispute = await prisma.dispute.findUnique({
      where: { id: data.disputeId },
      include: {
        order: {
          include: {
            seller: {
              select: { userId: true },
            },
          },
        },
      },
    });
    
    if (!dispute) {
      return error('النزاع غير موجود', 'DISPUTE_NOT_FOUND', 404);
    }
    
    // Only dispute opener, seller, or admin can send messages
    const isOpener = dispute.openedById === user.id;
    const isSeller = dispute.order.seller.userId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isOpener && !isSeller && !isAdmin) {
      return error('ليس لديك صلاحية للمشاركة في هذا النزاع', 'FORBIDDEN', 403);
    }
    
    // Can't send messages to closed disputes
    if (['RESOLVED', 'CLOSED'].includes(dispute.status)) {
      return error('لا يمكن إرسال رسائل في نزاع مغلق', 'DISPUTE_CLOSED', 400);
    }
    
    // Create message
    const message = await prisma.disputeMessage.create({
      data: {
        disputeId: data.disputeId,
        senderId: user.id,
        message: data.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
    
    return success(message, 201);
  } catch (err) {
    return handleError(err);
  }
}
