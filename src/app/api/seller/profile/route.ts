import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole, requireActiveUser } from '@/lib/rbac';
import { sellerProfileSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['SELLER', 'CUSTOMER', 'ADMIN']);
    await requireActiveUser();
    
    const body = await request.json();
    const data = sellerProfileSchema.parse(body);
    
    // Check if slug is already taken
    const existingSlug = await prisma.sellerProfile.findUnique({
      where: { slug: data.slug },
    });
    
    if (existingSlug && existingSlug.userId !== user.id) {
      return error('رابط المتجر مستخدم بالفعل', 'SLUG_EXISTS', 400);
    }
    
    // Check if user already has a profile
    const existingProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    
    if (existingProfile) {
      // Update existing profile
      const updated = await prisma.sellerProfile.update({
        where: { id: existingProfile.id },
        data: {
          storeName: data.storeName,
          slug: data.slug,
          bio: data.bio,
          phone: data.phone,
        },
      });
      
      return success(updated);
    }
    
    // Create new profile - also update user role to SELLER if they're a customer
    const [sellerProfile] = await prisma.$transaction([
      prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: data.storeName,
          slug: data.slug,
          bio: data.bio,
          phone: data.phone,
          verificationStatus: 'PENDING',
        },
      }),
      // Upgrade to seller role if customer
      ...(user.role === 'CUSTOMER'
        ? [
            prisma.user.update({
              where: { id: user.id },
              data: { role: 'SELLER' },
            }),
          ]
        : []),
    ]);
    
    return success(sellerProfile, 201);
  } catch (err) {
    return handleError(err);
  }
}
