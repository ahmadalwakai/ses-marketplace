import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { sendPasswordResetEmail } from '@/lib/email/resend';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per hour per key

// Token expiry in minutes
const TOKEN_EXPIRY_MINUTES = 60;

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Check and update rate limit
 * Returns true if request is allowed, false if rate limited
 */
async function checkRateLimit(key: string): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  
  try {
    const entry = await prisma.rateLimitEntry.findUnique({
      where: { key },
    });
    
    if (!entry) {
      // First request, create entry
      await prisma.rateLimitEntry.create({
        data: { key, count: 1, lastReset: now },
      });
      return true;
    }
    
    // Check if window has expired
    if (entry.lastReset < windowStart) {
      // Reset the counter
      await prisma.rateLimitEntry.update({
        where: { key },
        data: { count: 1, lastReset: now },
      });
      return true;
    }
    
    // Check if limit exceeded
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    // Increment counter
    await prisma.rateLimitEntry.update({
      where: { key },
      data: { count: entry.count + 1 },
    });
    
    return true;
  } catch (err) {
    // On error, allow the request but log
    console.error('Rate limit check error:', err);
    return true;
  }
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = forgotPasswordSchema.parse(body);
    const email = data.email.toLowerCase();
    
    // Get client IP for rate limiting
    const ip = getClientIP(request);
    const rateLimitKey = `forgot-password:${ip}:${email}`;
    
    // Check rate limit
    const allowed = await checkRateLimit(rateLimitKey);
    if (!allowed) {
      // Return success anyway to prevent enumeration
      // but don't actually process the request
      return success({ 
        message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور' 
      });
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    });
    
    // If user exists and has a password (credentials user)
    if (user && user.password) {
      // Generate secure random token
      const rawToken = randomBytes(32).toString('hex');
      const hashedToken = hashToken(rawToken);
      
      // Set expiry time
      const expires = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
      
      // Invalidate any existing tokens for this email
      await prisma.passwordResetToken.updateMany({
        where: { email, used: false },
        data: { used: true },
      });
      
      // Create new token
      await prisma.passwordResetToken.create({
        data: {
          email,
          token: hashedToken,
          expires,
        },
      });
      
      // Build reset URL
      // Send email (don't await to avoid timing attacks)
      sendPasswordResetEmail(user.email, rawToken).catch(console.error);
    }
    
    // Always return success to prevent user enumeration
    return success({ 
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور' 
    });
  } catch (err) {
    return handleError(err);
  }
}
