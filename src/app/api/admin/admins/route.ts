import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';
import { sendAdminWelcomeEmail, sendAdminInviteEmail } from '@/lib/email/resend';
import crypto from 'crypto';

// ============================================
// Validation schemas
// ============================================

const addAdminSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  role: z.enum(['ADMIN']).optional().default('ADMIN'),
});

const removeAdminSchema = z.object({
  userId: z.string().cuid('معرّف المستخدم غير صالح'),
});

// ============================================
// GET: List all admin users
// ============================================

export async function GET() {
  try {
    const admin = await requireAdminActive();

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return success(admins);
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// POST: Add/promote a user to admin, or invite by email
// ============================================

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminActive();
    const body = await request.json();
    const { email, role } = addAdminSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent adding self
    if (normalizedEmail === admin.email.toLowerCase()) {
      return error('لا يمكنك ترقية نفسك', 'SELF_PROMOTION', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // User exists — promote to ADMIN
      if (existingUser.role === 'ADMIN') {
        return error('هذا المستخدم مشرف بالفعل', 'ALREADY_ADMIN', 400);
      }

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Send welcome email (fire-and-forget)
      sendAdminWelcomeEmail(updated.email, updated.name || 'مشرف جديد').catch((err) => {
        console.error('Failed to send admin welcome email:', err);
      });

      console.info(`[Admin] User ${updated.email} promoted to ADMIN by ${admin.email}`);

      return success(updated, 201);
    }

    // User does not exist — create invite
    // Invalidate any existing unused invite for this email
    await prisma.inviteToken.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.inviteToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    // Send invite email (fire-and-forget)
    sendAdminInviteEmail(normalizedEmail, token).catch((err) => {
      console.error('Failed to send admin invite email:', err);
    });

    console.info(`[Admin] Invite sent to ${normalizedEmail} by ${admin.email}`);

    return success(
      {
        invited: true,
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString(),
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}

// ============================================
// DELETE: Demote admin back to CUSTOMER
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdminActive();
    const body = await request.json();
    const { userId } = removeAdminSchema.parse(body);

    // Prevent self-demotion
    if (userId === admin.id) {
      return error('لا يمكنك إزالة نفسك من صلاحيات المشرف', 'SELF_DEMOTION', 400);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return error('المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }

    if (targetUser.role !== 'ADMIN') {
      return error('هذا المستخدم ليس مشرفاً', 'NOT_ADMIN', 400);
    }

    // Prevent removing the last admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount <= 1) {
      return error(
        'لا يمكن إزالة آخر مشرف — يجب أن يبقى مشرف واحد على الأقل',
        'LAST_ADMIN',
        400
      );
    }

    const demoted = await prisma.user.update({
      where: { id: userId },
      data: { role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    console.info(`[Admin] User ${demoted.email} demoted from ADMIN by ${admin.email}`);

    return success(demoted);
  } catch (err) {
    return handleError(err);
  }
}
