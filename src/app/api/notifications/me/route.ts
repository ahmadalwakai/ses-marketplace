import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

/**
 * GET /api/notifications/me
 * Get current user's notifications
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {}),
    };
    
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);
    
    return success({ notifications, unreadCount });
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH /api/notifications/me
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { ids, markAllRead } = body;
    
    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    } else if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: user.id,
        },
        data: { read: true },
      });
    }
    
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    
    return success({ unreadCount });
  } catch (err) {
    return handleError(err);
  }
}
