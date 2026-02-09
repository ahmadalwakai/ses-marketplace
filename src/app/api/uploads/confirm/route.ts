import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { confirmUploadSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { confirmUpload } from '@/lib/uploads/r2';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = confirmUploadSchema.parse(body);
    
    const result = await confirmUpload(user.id, data.key);
    
    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
