import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const createSellerCommissionSchema = z.object({
  sellerId: z.string().min(1),
  tier: z.enum(['STANDARD', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'CUSTOM']).default('STANDARD'),
  commissionRate: z.number().min(0).max(1),
  notes: z.string().optional(),
});

/**
 * GET /api/admin/commission/sellers
 * List all seller commission overrides
 */
export async function GET() {
  try {
    await requireAdmin();
    
    const commissions = await prisma.sellerCommission.findMany({
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            verificationStatus: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return success(commissions);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/admin/commission/sellers
 * Create a seller commission override
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = createSellerCommissionSchema.parse(body);
    
    // Check if seller exists
    const seller = await prisma.sellerProfile.findUnique({
      where: { id: data.sellerId },
    });
    
    if (!seller) {
      return handleError(new Error('البائع غير موجود'));
    }
    
    // Check if override already exists
    const existing = await prisma.sellerCommission.findUnique({
      where: { sellerId: data.sellerId },
    });
    
    if (existing) {
      return handleError(new Error('يوجد تجاوز عمولة لهذا البائع بالفعل'));
    }
    
    const commission = await prisma.sellerCommission.create({
      data: {
        sellerId: data.sellerId,
        tier: data.tier,
        commissionRate: data.commissionRate,
        notes: data.notes,
      },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            verificationStatus: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'CREATE_SELLER_COMMISSION',
        entityType: 'SellerCommission',
        entityId: commission.id,
        metadata: {
          sellerId: data.sellerId,
          tier: data.tier,
          commissionRate: data.commissionRate,
        },
      },
    });
    
    return success(commission);
  } catch (err) {
    return handleError(err);
  }
}
