import { NextRequest } from 'next/server';
import prisma, { createAuditLog, notifyAdmins } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { categorySchema, paginationSchema } from '@/lib/validations';
import { success, error, paginated, handleError, paginationMeta } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAdminActive();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { page, limit } = paginationSchema.parse(params);
    
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          parent: {
            select: { id: true, name: true, nameAr: true },
          },
          _count: {
            select: { products: true, children: true },
          },
        },
      }),
      prisma.category.count(),
    ]);
    
    const pagination = paginationMeta(page, limit, total);
    
    return paginated(categories, pagination);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminActive();
    const body = await request.json();
    const data = categorySchema.parse(body);
    
    // Check slug uniqueness
    const existingSlug = await prisma.category.findUnique({
      where: { slug: data.slug },
    });
    
    if (existingSlug) {
      return error('رابط الفئة مستخدم بالفعل', 'SLUG_EXISTS', 400);
    }
    
    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        return error('الفئة الأم غير موجودة', 'PARENT_NOT_FOUND', 400);
      }
    }
    
    const category = await prisma.category.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
    
    // Log action
    await createAuditLog({
      adminId: admin.id,
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: category.id,
      metadata: { name: data.name },
    });
    
    return success(category, 201);
  } catch (err) {
    return handleError(err);
  }
}
