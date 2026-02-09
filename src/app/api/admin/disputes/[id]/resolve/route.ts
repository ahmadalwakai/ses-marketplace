import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { resolveDisputeSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendDisputeResolvedEmail } from '@/lib/email/resend';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, outcome } = resolveDisputeSchema.parse(body);
    
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: { select: { email: true } },
            seller: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });
    
    if (!dispute) {
      return error('النزاع غير موجود', 'DISPUTE_NOT_FOUND', 404);
    }
    
    if (['RESOLVED', 'CLOSED'].includes(dispute.status)) {
      return error('النزاع محلول بالفعل', 'DISPUTE_ALREADY_RESOLVED', 400);
    }
    
    const previousStatus = dispute.status;
    
    // Update dispute and order status
    await prisma.$transaction([
      prisma.dispute.update({
        where: { id },
        data: { status, outcome },
      }),
      prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: 'RESOLVED' },
      }),
    ]);
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'RESOLVE_DISPUTE',
        entityType: 'Dispute',
        entityId: id,
        metadata: { previousStatus, newStatus: status, outcome },
      },
    });
    
    // Notify parties
    sendDisputeResolvedEmail(
      dispute.order.customer.email,
      id,
      dispute.orderId,
      outcome
    ).catch(console.error);
    
    sendDisputeResolvedEmail(
      dispute.order.seller.user.email,
      id,
      dispute.orderId,
      outcome
    ).catch(console.error);
    
    return success({ id, status, outcome });
  } catch (err) {
    return handleError(err);
  }
}
