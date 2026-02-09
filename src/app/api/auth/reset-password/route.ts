import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { sendPasswordResetSuccessEmail } from '@/lib/email/resend';

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = resetPasswordSchema.parse(body);
    
    // Hash the provided token to compare with stored hash
    const hashedToken = hashToken(data.token);
    
    // Find valid token
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expires: { gt: new Date() },
      },
    });
    
    if (!tokenRecord) {
      return error(
        'رمز إعادة التعيين غير صالح أو منتهي الصلاحية',
        'INVALID_TOKEN',
        400
      );
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.email },
    });
    
    if (!user) {
      return error(
        'رمز إعادة التعيين غير صالح',
        'USER_NOT_FOUND',
        400
      );
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(data.password);
    
    // Update user password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
      // Invalidate all other tokens for this email
      prisma.passwordResetToken.updateMany({
        where: { email: tokenRecord.email, used: false },
        data: { used: true },
      }),
    ]);
    
    // Send confirmation email (don't await)
    sendPasswordResetSuccessEmail(user.email).catch(console.error);
    
    return success({ 
      message: 'تم تغيير كلمة المرور بنجاح' 
    });
  } catch (err) {
    return handleError(err);
  }
}
