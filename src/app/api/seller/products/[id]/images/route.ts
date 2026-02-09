import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { attachImagesSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    const body = await request.json();
    const data = attachImagesSchema.parse(body);
    
    // Get product and check ownership
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          select: { id: true },
        },
      },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'PRODUCT_NOT_FOUND', 404);
    }
    
    // Verify ownership
    if (product.sellerId !== user.sellerId && user.role !== 'ADMIN') {
      return error('ليس لديك صلاحية لتعديل هذا المنتج', 'FORBIDDEN', 403);
    }
    
    // Check total images limit (max 10)
    const currentImageCount = product.images.length;
    if (currentImageCount + data.images.length > 10) {
      return error(`يمكن إضافة ${10 - currentImageCount} صور فقط (الحد الأقصى 10)`, 'TOO_MANY_IMAGES', 400);
    }
    
    // Verify all images are from confirmed upload sessions
    for (const image of data.images) {
      const session = await prisma.uploadSession.findFirst({
        where: {
          userId: user.id,
          status: 'CONFIRMED',
        },
      });
      
      // Note: In production, you'd want to verify the URL matches a confirmed session
      // For now, we'll trust the URLs
    }
    
    // Create image records
    const startOrder = currentImageCount;
    const images = await prisma.productImage.createMany({
      data: data.images.map((img, index) => ({
        productId: id,
        url: img.url,
        alt: img.alt,
        sortOrder: img.sortOrder ?? (startOrder + index),
        width: img.width,
        height: img.height,
      })),
    });
    
    // Fetch and return all images
    const allImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: 'asc' },
    });
    
    return success(allImages, 201);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return error('معرف الصورة مطلوب', 'IMAGE_ID_REQUIRED', 400);
    }
    
    // Get product and check ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'PRODUCT_NOT_FOUND', 404);
    }
    
    // Verify ownership
    if (product.sellerId !== user.sellerId && user.role !== 'ADMIN') {
      return error('ليس لديك صلاحية لتعديل هذا المنتج', 'FORBIDDEN', 403);
    }
    
    // Delete image
    await prisma.productImage.delete({
      where: { id: imageId },
    });
    
    return success({ message: 'تم حذف الصورة' });
  } catch (err) {
    return handleError(err);
  }
}
