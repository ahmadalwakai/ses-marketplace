import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const bodySchema = z.object({
  ids: z.array(z.string()).optional(),
  markAllRead: z.boolean().optional(),
});

/**
 * PATCH /api/notifications/admin/mark-read
 * Mark admin notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminActive();
    const body = await request.json();
    const { ids, markAllRead } = bodySchema.parse(body);

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: admin.id, isRead: false },
        data: { isRead: true, read: true },
      });
    } else if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: admin.id,
        },
        data: { isRead: true, read: true },
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: admin.id, isRead: false },
    });

    return success({ unreadCount });
  } catch (err) {
    return handleError(err);
  }
}
