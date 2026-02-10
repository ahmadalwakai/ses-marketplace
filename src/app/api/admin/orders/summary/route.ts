import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAdmin();

    const [counts, revenue] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.order.aggregate({
        _sum: { total: true },
      }),
    ]);

    return success({
      byStatus: Object.fromEntries(counts.map((c) => [c.status, c._count])),
      totalRevenue: Number(revenue._sum.total || 0),
    });
  } catch (err) {
    return handleError(err);
  }
}
