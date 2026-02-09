import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller, requireOwnership } from '@/lib/rbac';
import { updateProductSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { recomputeProductScore } from '@/lib/ranking';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    const body = await request.json();
    const data = updateProductSchema.parse(body);
    
    // Get product and check ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'PRODUCT_NOT_FOUND', 404);
    }
    
    // Verify ownership (seller profile match)
    if (product.sellerId !== user.sellerId && user.role !== 'ADMIN') {
      return error('ليس لديك صلاحية لتعديل هذا المنتج', 'FORBIDDEN', 403);
    }
    
    // Check slug uniqueness if being changed
    if (data.slug && data.slug !== product.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        return error('رابط المنتج مستخدم بالفعل', 'SLUG_EXISTS', 400);
      }
    }
    
    // Validate category if being changed
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || !category.isActive) {
        return error('الفئة غير موجودة أو غير مفعلة', 'INVALID_CATEGORY', 400);
      }
    }
    
    // Update product
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.titleAr !== undefined && { titleAr: data.titleAr }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description && { description: data.description }),
        ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
        ...(data.condition && { condition: data.condition }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency && { currency: data.currency }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.tags && { tags: data.tags }),
      },
    });
    
    // Recompute score
    await recomputeProductScore(updated.id);
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const user = await requireSeller();
    const { id } = await params;
    
    // Get product and check ownership
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return error('المنتج غير موجود', 'PRODUCT_NOT_FOUND', 404);
    }
    
    // Verify ownership
    if (product.sellerId !== user.sellerId && user.role !== 'ADMIN') {
      return error('ليس لديك صلاحية لحذف هذا المنتج', 'FORBIDDEN', 403);
    }
    
    // Check if product has orders
    const orderCount = await prisma.orderItem.count({
      where: { productId: id },
    });
    
    if (orderCount > 0) {
      // Soft delete - just mark as blocked
      await prisma.product.update({
        where: { id },
        data: { status: 'BLOCKED' },
      });
      return success({ message: 'تم إخفاء المنتج (له طلبات سابقة)' });
    }
    
    // Hard delete if no orders
    await prisma.product.delete({
      where: { id },
    });
    
    return success({ message: 'تم حذف المنتج' });
  } catch (err) {
    return handleError(err);
  }
}
