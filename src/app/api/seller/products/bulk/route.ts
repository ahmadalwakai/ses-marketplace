import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { bulkEditSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireSeller();
    const body = await request.json();
    const data = bulkEditSchema.parse(body);

    // Get all product IDs to verify ownership
    const productIds = data.items.map((item) => item.productId);
    
    // Fetch products owned by this seller
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        sellerId: user.sellerId,
      },
      select: { id: true },
    });

    const ownedProductIds = new Set(products.map((p) => p.id));
    
    // Check if any products are not owned by this seller
    const unauthorizedIds = productIds.filter((id) => !ownedProductIds.has(id));
    if (unauthorizedIds.length > 0) {
      return error(
        `ليس لديك صلاحية لتعديل بعض المنتجات`,
        'FORBIDDEN',
        403
      );
    }

    // Perform bulk update using transaction
    const updates = await prisma.$transaction(
      data.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            ...(item.price !== undefined && { price: item.price }),
            ...(item.quantity !== undefined && { quantity: item.quantity }),
          },
          select: {
            id: true,
            title: true,
            price: true,
            quantity: true,
          },
        })
      )
    );

    return success({
      updated: updates.length,
      products: updates,
    });
  } catch (err) {
    return handleError(err);
  }
}
