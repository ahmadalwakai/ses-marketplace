import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/rbac';
import { signUploadSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { createSignedUploadUrl } from '@/lib/uploads/r2';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = signUploadSchema.parse(body);
    
    const result = await createSignedUploadUrl(
      user.id,
      data.filename,
      data.mime,
      data.size
    );
    
    return success(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
