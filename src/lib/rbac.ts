import { auth } from '@/lib/auth';
import type { Role, UserStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get the current authenticated user from the session
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as AuthUser;
}

/**
 * Require authentication - throws if not logged in
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError('يجب تسجيل الدخول', 'UNAUTHORIZED', 401);
  }
  return user;
}

/**
 * Require the user to have one of the specified roles
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new AuthError('ليس لديك صلاحية للوصول', 'FORBIDDEN', 403);
  }
  return user;
}

/**
 * Require the user to have an active status
 */
export async function requireActiveUser(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.status !== 'ACTIVE') {
    if (user.status === 'SUSPENDED') {
      throw new AuthError('حسابك موقوف مؤقتاً', 'ACCOUNT_SUSPENDED', 403);
    }
    if (user.status === 'BANNED') {
      throw new AuthError('حسابك محظور', 'ACCOUNT_BANNED', 403);
    }
    throw new AuthError('حسابك غير مفعل', 'ACCOUNT_INACTIVE', 403);
  }
  return user;
}

/**
 * Check if the user owns a specific resource
 */
export async function requireOwnership<T extends { userId?: string; sellerId?: string; customerId?: string }>(
  entity: T | null,
  user: AuthUser
): Promise<T> {
  if (!entity) {
    throw new AuthError('المورد غير موجود', 'NOT_FOUND', 404);
  }
  
  const entityUserId = entity.userId || entity.sellerId || entity.customerId;
  
  // Admin can access everything
  if (user.role === 'ADMIN') {
    return entity;
  }
  
  // Check if user owns the entity
  const isOwner = entityUserId === user.id;
  
  // For sellers, also check if they own the seller profile
  if (!isOwner && entity.sellerId) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: entity.sellerId },
      select: { userId: true },
    });
    if (sellerProfile?.userId === user.id) {
      return entity;
    }
  }
  
  if (!isOwner) {
    throw new AuthError('ليس لديك صلاحية لهذا المورد', 'FORBIDDEN', 403);
  }
  
  return entity;
}

/**
 * Require the user to be an admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole(['ADMIN']);
}

/**
 * Require the user to be a seller (with an active profile)
 */
export async function requireSeller(): Promise<AuthUser & { sellerId: string }> {
  const user = await requireRole(['SELLER', 'ADMIN']);
  await requireActiveUser();
  
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });
  
  if (!sellerProfile) {
    throw new AuthError('يجب إنشاء ملف تعريف البائع أولاً', 'SELLER_PROFILE_REQUIRED', 403);
  }
  
  if (sellerProfile.verificationStatus !== 'APPROVED' && user.role !== 'ADMIN') {
    throw new AuthError('ملف البائع الخاص بك قيد المراجعة', 'SELLER_NOT_VERIFIED', 403);
  }
  
  return { ...user, sellerId: sellerProfile.id };
}

/**
 * Require the user to be a customer
 */
export async function requireCustomer(): Promise<AuthUser> {
  const user = await requireRole(['CUSTOMER', 'SELLER', 'ADMIN']);
  await requireActiveUser();
  return user;
}
