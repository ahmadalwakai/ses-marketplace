import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const createCategoryCommissionSchema = z.object({
  categoryId: z.string().min(1),
  commissionRate: z.number().min(0).max(1),
});

/**
 * GET /api/admin/commission/categories
 * List all category commission overrides
 */
export async function GET() {
  try {
    await requireAdmin();
    
    const commissions = await prisma.categoryCommission.findMany({
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
      },
      orderBy: { category: { name: 'asc' } },
    });
    
    return success(commissions);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/admin/commission/categories
 * Create a category commission override
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = createCategoryCommissionSchema.parse(body);
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    
    if (!category) {
      return handleError(new Error('الفئة غير موجودة'));
    }
    
    // Check if override already exists
    const existing = await prisma.categoryCommission.findUnique({
      where: { categoryId: data.categoryId },
    });
    
    if (existing) {
      return handleError(new Error('يوجد تجاوز عمولة لهذه الفئة بالفعل'));
    }
    
    const commission = await prisma.categoryCommission.create({
      data: {
        categoryId: data.categoryId,
        commissionRate: data.commissionRate,
      },
      include: {
        category: {
          select: { id: true, name: true, nameAr: true, slug: true },
        },
      },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_CATEGORY_COMMISSION',
        entityType: 'CategoryCommission',
        entityId: commission.id,
        metadata: { categoryId: data.categoryId, commissionRate: data.commissionRate },
      },
    });
    
    return success(commission);
  } catch (err) {
    return handleError(err);
  }
}
