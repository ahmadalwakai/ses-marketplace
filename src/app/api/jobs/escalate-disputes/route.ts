import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error, handleError } from '@/lib/api-response';
import { sendDisputeEscalatedEmail } from '@/lib/email/resend';

// Simple API key check for job security
const JOB_SECRET = process.env.JOB_SECRET || 'ses-job-secret-change-me';

/**
 * POST /api/jobs/escalate-disputes
 * Auto-escalate disputes with no seller response in 48 hours
 * Call this endpoint manually or via external cron service for MVP
 */
export async function POST(request: NextRequest) {
  try {
    // Verify job secret
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (providedSecret !== JOB_SECRET) {
      return error('Unauthorized', 'UNAUTHORIZED', 401);
    }
    
    // Find disputes that are OPEN for more than 48 hours
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    
    const disputesToEscalate = await prisma.dispute.findMany({
      where: {
        status: 'OPEN',
        createdAt: { lt: cutoffTime },
      },
      include: {
        order: {
          include: {
            customer: { select: { id: true, email: true, name: true } },
            seller: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        openedBy: { select: { email: true, name: true } },
      },
    });
    
    const escalated: string[] = [];
    
    for (const dispute of disputesToEscalate) {
      // Check if there are any messages from seller (indicating response)
      const sellerMessages = await prisma.disputeMessage.count({
        where: {
          disputeId: dispute.id,
          senderId: dispute.order.seller.user.id,
        },
      });
      
      // If no seller response, escalate
      if (sellerMessages === 0) {
        // Update dispute status
        await prisma.dispute.update({
          where: { id: dispute.id },
          data: { status: 'IN_REVIEW' },
        });
        
        // Send escalation emails
        sendDisputeEscalatedEmail(
          dispute.order.customer.email,
          dispute.id,
          dispute.orderId,
          dispute.reason
        ).catch(console.error);
        
        sendDisputeEscalatedEmail(
          dispute.order.seller.user.email,
          dispute.id,
          dispute.orderId,
          dispute.reason
        ).catch(console.error);
        
        // Create in-app notifications
        // To customer
        prisma.notification.create({
          data: {
            userId: dispute.order.customer.id,
            type: 'DISPUTE_ESCALATED',
            title: 'تم تصعيد النزاع',
            message: `تم تصعيد النزاع على الطلب #${dispute.orderId.slice(-8)} للإدارة`,
            link: `/dashboard`,
          },
        }).catch(console.error);
        
        // To seller
        prisma.notification.create({
          data: {
            userId: dispute.order.seller.user.id,
            type: 'DISPUTE_ESCALATED',
            title: 'تم تصعيد النزاع',
            message: `تم تصعيد النزاع على الطلب #${dispute.orderId.slice(-8)} بسبب عدم الرد`,
            link: `/seller/orders`,
          },
        }).catch(console.error);
        
        // Notify admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });
        
        for (const admin of admins) {
          prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'DISPUTE_ESCALATED',
              title: 'نزاع مُصعّد',
              message: `نزاع #${dispute.id.slice(-8)} يحتاج مراجعة (48 ساعة بدون رد)`,
              link: `/admin`,
            },
          }).catch(console.error);
        }
        
        escalated.push(dispute.id);
      }
    }
    
    return success({
      checked: disputesToEscalate.length,
      escalated: escalated.length,
      escalatedIds: escalated,
      message: `تم تصعيد ${escalated.length} نزاع`,
    });
  } catch (err) {
    return handleError(err);
  }
}
