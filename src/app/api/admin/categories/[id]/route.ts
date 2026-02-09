import { NextRequest } from 'next/server';
import prisma, { createAuditLog } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { updateCategorySchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdminActive();
    const { id } = await params;
    const body = await request.json();
    const data = updateCategorySchema.parse(body);
    
    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!category) {
      return error('الفئة غير موجودة', 'CATEGORY_NOT_FOUND', 404);
    }
    
    // Check slug uniqueness if being changed
    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existingSlug) {
        return error('رابط الفئة مستخدم بالفعل', 'SLUG_EXISTS', 400);
      }
    }
    
    // Validate parent if being changed
    if (data.parentId !== undefined && data.parentId !== category.parentId) {
      if (data.parentId) {
        // Can't set parent to self
        if (data.parentId === id) {
          return error('لا يمكن أن تكون الفئة أماً لنفسها', 'INVALID_PARENT', 400);
        }
        
        const parent = await prisma.category.findUnique({
          where: { id: data.parentId },
        });
        if (!parent) {
          return error('الفئة الأم غير موجودة', 'PARENT_NOT_FOUND', 400);
        }
        
        // Check for circular reference
        let currentParent = parent;
        while (currentParent.parentId) {
          if (currentParent.parentId === id) {
            return error('مرجع دائري غير مسموح', 'CIRCULAR_REFERENCE', 400);
          }
          const nextParent = await prisma.category.findUnique({
            where: { id: currentParent.parentId },
          });
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }
    }
    
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.slug && { slug: data.slug }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    
    // Log action
    await createAuditLog({
      adminId: admin.id,
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      metadata: data,
    });
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdminActive();
    const { id } = await params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });
    
    if (!category) {
      return error('الفئة غير موجودة', 'CATEGORY_NOT_FOUND', 404);
    }
    
    // Check for subcategories
    if (category._count.children > 0) {
      return error('لا يمكن حذف فئة لها فئات فرعية', 'HAS_CHILDREN', 400);
    }
    
    // Check for products
    if (category._count.products > 0) {
      return error('لا يمكن حذف فئة بها منتجات', 'HAS_PRODUCTS', 400);
    }
    
    await prisma.category.delete({
      where: { id },
    });
    
    // Log action
    await createAuditLog({
      adminId: admin.id,
      action: 'DELETE_CATEGORY',
      entityType: 'Category',
      entityId: id,
      metadata: { name: category.name },
    });
    
    return success({ message: 'تم حذف الفئة' });
  } catch (err) {
    return handleError(err);
  }
}
