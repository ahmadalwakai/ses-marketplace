import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { explainScore } from '@/lib/ranking';

interface RouteParams {
  params: Promise<{ productId: string }>;
}

/**
 * GET /api/admin/ranking/explain/[productId]
 * Get detailed score breakdown for a product
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { productId } = await params;
    
    const explanation = await explainScore(productId);
    
    return success(explanation);
  } catch (err) {
    return handleError(err);
  }
}
