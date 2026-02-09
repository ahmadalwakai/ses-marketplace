import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, requireActiveUser } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireRole(['SELLER', 'ADMIN']);
    await requireActiveUser();
    
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });
    
    if (!sellerProfile) {
      return error('لم يتم إنشاء ملف البائع بعد', 'SELLER_PROFILE_NOT_FOUND', 404);
    }
    
    return success(sellerProfile);
  } catch (err) {
    return handleError(err);
  }
}
