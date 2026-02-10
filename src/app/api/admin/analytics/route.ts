import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminActive();
    const { searchParams } = new URL(request.url);
    const daysParam = Math.min(Math.max(parseInt(searchParams.get('days') || '14', 10) || 14, 7), 90);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysParam + 1);

    const [orders, newUsers, newSellers, newProducts, viewTotals, cartTotals, orderItemsCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
        },
        select: { createdAt: true, total: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.sellerProfile.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.product.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.product.aggregate({
        _sum: { viewCount: true },
      }),
      prisma.product.aggregate({
        _sum: { addToCartCount: true },
      }),
      prisma.orderItem.count({
        where: { order: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } } },
      }),
    ]);

    const daily = new Map<string, { date: string; orders: number; gmv: number }>();
    for (let i = 0; i < daysParam; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = dateKey(d);
      daily.set(key, { date: key, orders: 0, gmv: 0 });
    }

    for (const order of orders) {
      const key = dateKey(order.createdAt);
      const entry = daily.get(key);
      if (entry) {
        entry.orders += 1;
        entry.gmv += Number(order.total);
      }
    }

    const dailySeries = Array.from(daily.values());
    const totalGmv = dailySeries.reduce((sum, d) => sum + d.gmv, 0);

    const totalViews = Number(viewTotals._sum.viewCount || 0);
    const totalAddToCart = Number(cartTotals._sum.addToCartCount || 0);
    const conversionRate = totalViews > 0 ? (totalAddToCart / totalViews) * 100 : 0;
    const orderRate = totalAddToCart > 0 ? (orderItemsCount / totalAddToCart) * 100 : 0;

    return success({
      rangeDays: daysParam,
      totals: {
        orders: orders.length,
        gmv: totalGmv,
        newUsers,
        newSellers,
        newProducts,
        conversionRate: Math.round(conversionRate * 100) / 100,
        orderRate: Math.round(orderRate * 100) / 100,
      },
      daily: dailySeries,
    });
  } catch (err) {
    return handleError(err);
  }
}
