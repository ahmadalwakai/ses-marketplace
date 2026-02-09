import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { updateAdminSettingsSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireAdmin();
    
    let settings = await prisma.adminSettings.findUnique({
      where: { id: 'singleton' },
    });
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: {
          id: 'singleton',
          freeMode: false,
          globalCommissionRate: 0.05,
          rankingWeights: {
            w_recency: 0.3,
            w_rating: 0.25,
            w_orders: 0.2,
            w_stock: 0.15,
            w_sellerRep: 0.1,
          },
          seoTemplates: {},
          featureFlags: {
            maxUploadSizeMb: 5,
            allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
          },
        },
      });
    }
    
    return success(settings);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const data = updateAdminSettingsSchema.parse(body);
    
    // Get current settings
    const current = await prisma.adminSettings.findUnique({
      where: { id: 'singleton' },
    });
    
    // Merge partial updates for nested objects
    const updateData: Record<string, unknown> = {};
    
    if (data.freeMode !== undefined) {
      updateData.freeMode = data.freeMode;
    }
    
    if (data.globalCommissionRate !== undefined) {
      updateData.globalCommissionRate = data.globalCommissionRate;
    }
    
    if (data.rankingWeights) {
      const currentWeights = (current?.rankingWeights as object) || {};
      updateData.rankingWeights = { ...currentWeights, ...data.rankingWeights };
    }
    
    if (data.seoTemplates) {
      const currentTemplates = (current?.seoTemplates as object) || {};
      updateData.seoTemplates = { ...currentTemplates, ...data.seoTemplates };
    }
    
    if (data.featureFlags) {
      const currentFlags = (current?.featureFlags as object) || {};
      updateData.featureFlags = { ...currentFlags, ...data.featureFlags };
    }
    
    const updated = await prisma.adminSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...updateData,
      },
      update: updateData,
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_SETTINGS',
        entityType: 'AdminSettings',
        entityId: 'singleton',
        metadata: { changes: data },
      },
    });
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
