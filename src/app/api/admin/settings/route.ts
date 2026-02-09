import { NextRequest } from 'next/server';
import prisma, { createAuditLog, notifyAdmins } from '@/lib/prisma';
import { requireAdminActive } from '@/lib/rbac';
import { success, handleError } from '@/lib/api-response';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  freeMode: z.boolean().optional(),
  globalCommissionRate: z.number().min(0).max(1).optional(),
  rankingWeights: z.record(z.number()).optional(),
  seoTemplates: z.record(z.string()).optional(),
  featureFlags: z.record(z.unknown()).optional(),
  navConfig: z.record(z.unknown()).optional(),
  cookieConsentConfig: z.record(z.unknown()).optional(),
  searchConfig: z.record(z.unknown()).optional(),
});

export async function GET() {
  try {
    await requireAdminActive();
    
    let settings = await prisma.adminSettings.findUnique({
      where: { id: 'singleton' },
    });
    
    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.adminSettings.create({
        data: { id: 'singleton' },
      });
    }
    
    return success(settings);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminActive();
    const body = await request.json();
    const data = updateSettingsSchema.parse(body);
    
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

    if (data.navConfig) {
      const currentNav = (current?.navConfig as object) || {};
      updateData.navConfig = { ...currentNav, ...data.navConfig };
    }

    if (data.cookieConsentConfig) {
      const currentCookie = (current?.cookieConsentConfig as object) || {};
      updateData.cookieConsentConfig = { ...currentCookie, ...data.cookieConsentConfig };
    }

    if (data.searchConfig) {
      const currentSearch = (current?.searchConfig as object) || {};
      updateData.searchConfig = { ...currentSearch, ...data.searchConfig };
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
    await createAuditLog({
      adminId: admin.id,
      action: 'UPDATE_SETTINGS',
      entityType: 'AdminSettings',
      entityId: 'singleton',
      metadata: { changes: data },
    });

    // Notify other admins about settings change
    await notifyAdmins({
      type: 'SETTINGS_CHANGED',
      title: 'تم تحديث الإعدادات',
      body: `قام ${admin.name || admin.email} بتحديث إعدادات النظام`,
      entityType: 'AdminSettings',
      entityId: 'singleton',
    });
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
