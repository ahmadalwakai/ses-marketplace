import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/rbac';
import { updateReportStatusSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status } = updateReportStatusSchema.parse(body);
    
    const report = await prisma.report.findUnique({
      where: { id },
    });
    
    if (!report) {
      return error('البلاغ غير موجود', 'REPORT_NOT_FOUND', 404);
    }
    
    const previousStatus = report.status;
    
    const updated = await prisma.report.update({
      where: { id },
      data: { status },
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'UPDATE_REPORT',
        entityType: 'Report',
        entityId: id,
        metadata: { previousStatus, newStatus: status },
      },
    });
    
    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
