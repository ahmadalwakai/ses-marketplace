import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAdmin();
    
    const [
      userCounts,
      productCounts,
      orderCounts,
      reviewCounts,
      disputeCounts,
      reportCounts,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      // User counts by role and status
      prisma.user.groupBy({
        by: ['role', 'status'],
        _count: true,
      }),
      // Product counts by status
      prisma.product.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Order counts by status and total revenue
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true, commissionTotal: true },
      }),
      // Review counts by status
      prisma.review.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Dispute counts by status
      prisma.dispute.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Report counts by status
      prisma.report.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Recent orders
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true, email: true } },
          seller: { select: { storeName: true } },
        },
      }),
      // Recent users
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);
    
    // Process counts into more useful format
    const users = {
      total: userCounts.reduce((acc, item) => acc + item._count, 0),
      byRole: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };
    
    for (const item of userCounts) {
      users.byRole[item.role] = (users.byRole[item.role] || 0) + item._count;
      users.byStatus[item.status] = (users.byStatus[item.status] || 0) + item._count;
    }
    
    const products = {
      total: productCounts.reduce((acc, item) => acc + item._count, 0),
      byStatus: Object.fromEntries(productCounts.map((p) => [p.status, p._count])),
    };
    
    const orders = {
      total: orderCounts.reduce((acc, item) => acc + item._count, 0),
      totalRevenue: orderCounts.reduce(
        (acc, item) => acc + (item._sum.total?.toNumber() || 0),
        0
      ),
      totalCommission: orderCounts.reduce(
        (acc, item) => acc + (item._sum.commissionTotal?.toNumber() || 0),
        0
      ),
      byStatus: Object.fromEntries(orderCounts.map((o) => [o.status, o._count])),
    };
    
    const reviews = {
      total: reviewCounts.reduce((acc, item) => acc + item._count, 0),
      byStatus: Object.fromEntries(reviewCounts.map((r) => [r.status, r._count])),
    };
    
    const disputes = {
      total: disputeCounts.reduce((acc, item) => acc + item._count, 0),
      byStatus: Object.fromEntries(disputeCounts.map((d) => [d.status, d._count])),
    };
    
    const reports = {
      total: reportCounts.reduce((acc, item) => acc + item._count, 0),
      byStatus: Object.fromEntries(reportCounts.map((r) => [r.status, r._count])),
    };
    
    return success({
      users,
      products,
      orders,
      reviews,
      disputes,
      reports,
      recentOrders,
      recentUsers,
    });
  } catch (err) {
    return handleError(err);
  }
}
