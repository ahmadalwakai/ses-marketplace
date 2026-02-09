import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = Math.min(Math.max(parseInt(period) || 30, 1), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get seller's products with insights
    const products = await prisma.product.findMany({
      where: { sellerId: user.sellerId },
      select: {
        id: true,
        title: true,
        titleAr: true,
        slug: true,
        price: true,
        quantity: true,
        status: true,
        viewCount: true,
        addToCartCount: true,
        createdAt: true,
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: { viewCount: 'desc' },
    });

    // Get orders count in period
    const ordersInPeriod = await prisma.order.count({
      where: {
        sellerId: user.sellerId,
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED'] },
      },
    });

    // Get total revenue in period
    const revenueData = await prisma.order.aggregate({
      where: {
        sellerId: user.sellerId,
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED', 'DISPUTED'] },
      },
      _sum: { total: true },
    });

    // Get order status breakdown
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: {
        sellerId: user.sellerId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Calculate totals
    const totalViews = products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalAddToCarts = products.reduce((sum, p) => sum + p.addToCartCount, 0);
    const totalOrders = products.reduce((sum, p) => sum + p._count.orderItems, 0);

    // Top products by views
    const topByViews = products.slice(0, 5).map((p) => ({
      id: p.id,
      title: p.titleAr || p.title,
      slug: p.slug,
      views: p.viewCount,
    }));

    // Top products by add-to-cart (conversion proxy)
    const topByAddToCart = [...products]
      .sort((a, b) => b.addToCartCount - a.addToCartCount)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.titleAr || p.title,
        slug: p.slug,
        addToCarts: p.addToCartCount,
      }));

    // Top products by orders
    const topByOrders = [...products]
      .sort((a, b) => b._count.orderItems - a._count.orderItems)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.titleAr || p.title,
        slug: p.slug,
        orders: p._count.orderItems,
      }));

    // Low stock products
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: user.sellerId },
      select: { lowStockThreshold: true },
    });
    const threshold = sellerProfile?.lowStockThreshold || 5;

    const lowStockProducts = products
      .filter((p) => p.quantity <= threshold && p.status === 'ACTIVE')
      .map((p) => ({
        id: p.id,
        title: p.titleAr || p.title,
        slug: p.slug,
        quantity: p.quantity,
      }));

    // Calculate conversion rate (addToCart / views)
    const conversionRate = totalViews > 0 ? (totalAddToCarts / totalViews) * 100 : 0;
    // Calculate order rate (orders / addToCart)
    const orderRate = totalAddToCarts > 0 ? (totalOrders / totalAddToCarts) * 100 : 0;

    return success({
      period: periodDays,
      summary: {
        totalProducts: products.length,
        activeProducts: products.filter((p) => p.status === 'ACTIVE').length,
        totalViews,
        totalAddToCarts,
        totalOrders,
        ordersInPeriod,
        revenue: Number(revenueData._sum.total || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        orderRate: Math.round(orderRate * 100) / 100,
        lowStockCount: lowStockProducts.length,
        lowStockThreshold: threshold,
      },
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      topByViews,
      topByAddToCart,
      topByOrders,
      lowStockProducts,
      products: products.map((p) => ({
        id: p.id,
        title: p.titleAr || p.title,
        slug: p.slug,
        price: Number(p.price),
        quantity: p.quantity,
        status: p.status,
        views: p.viewCount,
        addToCarts: p.addToCartCount,
        orders: p._count.orderItems,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
