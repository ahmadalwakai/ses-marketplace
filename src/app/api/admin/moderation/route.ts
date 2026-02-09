import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

/**
 * GET /api/admin/moderation
 * Get a combined view of all pending moderation items
 */
export async function GET() {
  try {
    await requireAdmin();
    
    // Fetch all pending items in parallel
    const [
      pendingSellers,
      pendingReviews,
      pendingReports,
      pendingProducts,
      blockedProducts,
    ] = await Promise.all([
      // Pending sellers awaiting approval
      prisma.sellerProfile.findMany({
        where: { verificationStatus: 'PENDING' },
        include: {
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      
      // Pending reviews awaiting moderation
      prisma.review.findMany({
        where: { status: 'PENDING' },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          product: {
            select: { id: true, title: true, slug: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      
      // Pending reports
      prisma.report.findMany({
        where: { status: 'PENDING' },
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      
      // Products pending moderation
      prisma.product.findMany({
        where: { status: 'PENDING' },
        include: {
          seller: {
            select: { id: true, storeName: true, slug: true },
          },
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      
      // Blocked products
      prisma.product.findMany({
        where: { status: 'BLOCKED' },
        include: {
          seller: {
            select: { id: true, storeName: true, slug: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);
    
    return success({
      counts: {
        pendingSellers: pendingSellers.length,
        pendingReviews: pendingReviews.length,
        pendingReports: pendingReports.length,
        pendingProducts: pendingProducts.length,
        blockedProducts: blockedProducts.length,
        total: pendingSellers.length + pendingReviews.length + pendingReports.length + pendingProducts.length,
      },
      pendingSellers,
      pendingReviews,
      pendingReports,
      pendingProducts,
      blockedProducts,
    });
  } catch (err) {
    return handleError(err);
  }
}
