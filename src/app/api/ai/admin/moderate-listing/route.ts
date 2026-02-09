import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { moderateListingSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { moderateListing } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await request.json();
    const data = moderateListingSchema.parse(body);
    
    const result = await moderateListing(
      data.title,
      data.description,
      data.category,
      user.id
    );
    
    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
