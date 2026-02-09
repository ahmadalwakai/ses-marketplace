import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, paginated, handleError, paginationMeta } from '@/lib/api-response';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  unreadOnly: z.coerce.boolean().default(false),
  type: z.string().optional(),
});

/**
 * GET /api/notifications/admin
 * Get admin notifications with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminActive();

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit, unreadOnly, type } = querySchema.parse(params);

    const where = {
      userId: admin.id,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(type ? { type } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          body: true,
          entityType: true,
          entityId: true,
          isRead: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: admin.id, isRead: false },
      }),
    ]);

    const pagination = paginationMeta(page, limit, total);

    return success({
      items: notifications,
      pagination,
      unreadCount,
    });
  } catch (err) {
    return handleError(err);
  }
}
