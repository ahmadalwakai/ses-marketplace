import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { sendWelcomeEmailWithRole } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    
    if (existingUser) {
      const { error } = await import('@/lib/api-response');
      return error('البريد الإلكتروني مستخدم بالفعل', 'EMAIL_EXISTS', 400);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Check if there is a valid invite token for this email
    let assignedRole: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER';
    const inviteToken = body.invite
      ? await prisma.inviteToken.findFirst({
          where: {
            token: body.invite as string,
            email: data.email.toLowerCase(),
            used: false,
            expiresAt: { gt: new Date() },
          },
        })
      : null;

    if (inviteToken) {
      assignedRole = 'ADMIN';
      // Mark the invite token as used
      await prisma.inviteToken.update({
        where: { id: inviteToken.id },
        data: { used: true },
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        password: hashedPassword,
        role: assignedRole,
        status: 'ACTIVE', // Auto-activate for now
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    
    // Send welcome email with role info (don't await to avoid blocking)
    sendWelcomeEmailWithRole(user.email, user.name || 'مستخدم', user.role).catch(console.error);
    
    return success(user, 201);
  } catch (err) {
    return handleError(err);
  }
}
