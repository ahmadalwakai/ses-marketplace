import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCustomer, requireOwnership } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const user = await requireCustomer();
    const { id } = await params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                titleAr: true,
                slug: true,
                images: {
                  select: { url: true, alt: true },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            phone: true,
            user: {
              select: { name: true },
            },
          },
        },
        reviews: {
          select: {
            id: true,
            productId: true,
            rating: true,
            comment: true,
            status: true,
            createdAt: true,
          },
        },
        dispute: {
          select: {
            id: true,
            status: true,
            reason: true,
            outcome: true,
            createdAt: true,
          },
        },
      },
    });
    
    // Check ownership
    await requireOwnership(order, user);
    
    return success(order);
  } catch (err) {
    return handleError(err);
  }
}
