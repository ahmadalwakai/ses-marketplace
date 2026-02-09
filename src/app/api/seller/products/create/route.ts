import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { createProductSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { recomputeProductScore } from '@/lib/ranking';

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller();
    const body = await request.json();
    const data = createProductSchema.parse(body);
    
    // Check if slug is already taken
    const existingSlug = await prisma.product.findUnique({
      where: { slug: data.slug },
    });
    
    if (existingSlug) {
      return error('رابط المنتج مستخدم بالفعل', 'SLUG_EXISTS', 400);
    }
    
    // Validate category exists if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category || !category.isActive) {
        return error('الفئة غير موجودة أو غير مفعلة', 'INVALID_CATEGORY', 400);
      }
    }
    
    // Create product
    const product = await prisma.product.create({
      data: {
        sellerId: user.sellerId,
        title: data.title,
        titleAr: data.titleAr,
        slug: data.slug,
        description: data.description,
        descriptionAr: data.descriptionAr,
        condition: data.condition,
        price: data.price,
        currency: data.currency,
        quantity: data.quantity,
        categoryId: data.categoryId,
        brand: data.brand,
        tags: data.tags,
        status: 'PENDING', // Needs admin approval
      },
    });
    
    // Compute initial score
    await recomputeProductScore(product.id);
    
    return success(product, 201);
  } catch (err) {
    return handleError(err);
  }
}
