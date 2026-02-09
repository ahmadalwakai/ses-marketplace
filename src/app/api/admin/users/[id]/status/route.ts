import { NextRequest } from 'next/server';
import prisma, { createAuditLog, notifyAdmins } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { updateUserStatusSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendAccountSuspendedEmail, sendAccountBannedEmail, sendAccountActivatedEmail } from '@/lib/email/resend';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdminActive();
    const { id } = await params;
    const body = await request.json();
    const { status } = updateUserStatusSchema.parse({ ...body, id });
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      return error('المستخدم غير موجود', 'USER_NOT_FOUND', 404);
    }
    
    // Prevent admin from modifying own status
    if (user.id === admin.id) {
      return error('لا يمكنك تعديل حالة حسابك', 'CANNOT_MODIFY_SELF', 400);
    }
    
    // Prevent modifying other admins (unless super admin)
    if (user.role === 'ADMIN' && user.email !== process.env.ADMIN_EMAIL) {
      return error('لا يمكنك تعديل حالة مدير آخر', 'CANNOT_MODIFY_ADMIN', 403);
    }
    
    const previousStatus = user.status;
    
    // Update status
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });
    
    // Log the action
    await createAuditLog({
      adminId: admin.id,
      action: 'UPDATE_USER_STATUS',
      entityType: 'User',
      entityId: id,
      metadata: { previousStatus, newStatus: status },
    });
    
    // Send email notification
    if (status === 'SUSPENDED') {
      sendAccountSuspendedEmail(user.email).catch(console.error);
    } else if (status === 'BANNED') {
      sendAccountBannedEmail(user.email).catch(console.error);
    } else if (status === 'ACTIVE' && previousStatus !== 'ACTIVE') {
      sendAccountActivatedEmail(user.email, user.name || 'مستخدم').catch(console.error);
    }
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
