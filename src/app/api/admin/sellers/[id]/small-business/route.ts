import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, error, handleError } from '@/lib/api-response';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const toggleSchema = z.object({
  isSmallBusiness: z.boolean(),
});

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    const { id } = await params;
    const body = await request.json();
    const { isSmallBusiness } = toggleSchema.parse(body);
    
    // Check if seller exists
    const existingSeller = await prisma.sellerProfile.findUnique({
      where: { id },
      select: { id: true, storeName: true },
    });
    
    if (!existingSeller) {
      return error('البائع غير موجود', 'NOT_FOUND', 404);
    }
    
    // Update the seller's small business status
    const updatedSeller = await prisma.sellerProfile.update({
      where: { id },
      data: { isSmallBusiness },
      select: {
        id: true,
        storeName: true,
        isSmallBusiness: true,
      },
    });
    
    return success({
      seller: updatedSeller,
      message: isSmallBusiness
        ? `تم تصنيف "${updatedSeller.storeName}" كمشروع صغير`
        : `تم إزالة تصنيف المشروع الصغير من "${updatedSeller.storeName}"`,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await requireAdmin();
    
    const { id } = await params;
    
    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      select: {
        id: true,
        storeName: true,
        slug: true,
        isSmallBusiness: true,
        verificationStatus: true,
        verificationLevel: true,
      },
    });
    
    if (!seller) {
      return error('البائع غير موجود', 'NOT_FOUND', 404);
    }
    
    return success(seller);
  } catch (err) {
    return handleError(err);
  }
}
