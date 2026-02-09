import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSeller } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

const periodSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year', 'all']).default('month'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeller();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { period } = periodSchema.parse(params);
    
    // Calculate date range
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
      default:
        startDate = undefined;
    }
    
    // Get all delivered orders for this seller in the period
    const deliveredOrders = await prisma.order.findMany({
      where: {
        sellerId: user.sellerId,
        status: 'DELIVERED',
        ...(startDate && { createdAt: { gte: startDate } }),
      },
      include: {
        items: {
          select: {
            lineTotal: true,
            commissionAmount: true,
            sellerNetAmount: true,
          },
        },
      },
    });
    
    // Calculate totals
    let grossEarnings = new Decimal(0);
    let totalCommission = new Decimal(0);
    let netEarnings = new Decimal(0);
    
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        grossEarnings = grossEarnings.add(item.lineTotal);
        totalCommission = totalCommission.add(item.commissionAmount);
        netEarnings = netEarnings.add(item.sellerNetAmount);
      }
    }
    
    // Get pending earnings (orders not yet delivered)
    const pendingOrders = await prisma.order.findMany({
      where: {
        sellerId: user.sellerId,
        status: { in: ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED'] },
      },
      include: {
        items: {
          select: {
            sellerNetAmount: true,
          },
        },
      },
    });
    
    let pendingEarnings = new Decimal(0);
    for (const order of pendingOrders) {
      for (const item of order.items) {
        pendingEarnings = pendingEarnings.add(item.sellerNetAmount);
      }
    }
    
    // Get order counts by status
    const orderCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { sellerId: user.sellerId },
      _count: true,
    });
    
    const statusCounts = Object.fromEntries(
      orderCounts.map((item) => [item.status, item._count])
    );
    
    return success({
      period,
      earnings: {
        gross: grossEarnings.toNumber(),
        commission: totalCommission.toNumber(),
        net: netEarnings.toNumber(),
        pending: pendingEarnings.toNumber(),
      },
      orderCount: {
        delivered: deliveredOrders.length,
        total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
        byStatus: statusCounts,
      },
      currency: 'SYP',
    });
  } catch (err) {
    return handleError(err);
  }
}
