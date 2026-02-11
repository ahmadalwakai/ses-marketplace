import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';

export async function GET() {
  try {
    const authUser = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { walletBalance: true, walletCurrency: true },
    });

    return success({
      walletBalance: user ? Number(user.walletBalance) : 0,
      walletCurrency: user?.walletCurrency ?? 'USD',
    });
  } catch (err) {
    return handleError(err);
  }
}
