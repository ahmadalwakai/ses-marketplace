import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Resilience: log connection issues in dev so they surface early
  client.$connect().catch((err: unknown) => {
    console.error('[Prisma] Failed to connect to database:', err);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// ============================================
// ADMIN NOTIFICATION HELPER
// ============================================

/**
 * Create in-app notifications for all admin users.
 * Optionally sends a critical email to the super admin.
 */
export async function notifyAdmins(opts: {
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  critical?: boolean;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: opts.type,
          title: opts.title,
          message: opts.body,
          body: opts.body,
          entityType: opts.entityType ?? null,
          entityId: opts.entityId ?? null,
          read: false,
          isRead: false,
        })),
      });
    }

    if (opts.critical) {
      const { sendAdminCriticalEventEmail } = await import('@/lib/email/resend');
      sendAdminCriticalEventEmail(
        opts.type,
        opts.title,
        opts.body,
        opts.entityType,
        opts.entityId
      ).catch(console.error);
    }
  } catch (err) {
    console.error('notifyAdmins error:', err);
  }
}

// ============================================
// AUDIT LOG HELPER
// ============================================

export async function createAuditLog(opts: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        entityType: opts.entityType,
        entityId: opts.entityId,
        metadata: (opts.metadata ?? {}) as object,
      },
    });
  } catch (err) {
    console.error('createAuditLog error:', err);
  }
}

// ============================================
// ADMIN SETTINGS HELPER
// ============================================

export async function getAdminSettings() {
  let settings = await prisma.adminSettings.findUnique({
    where: { id: 'singleton' },
  });

  if (!settings) {
    settings = await prisma.adminSettings.create({
      data: { id: 'singleton' },
    });
  }

  return settings;
}
