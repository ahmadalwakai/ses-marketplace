import { NextRequest } from 'next/server';
import { requireSeller } from '@/lib/rbac';
import { optimizeListingSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { optimizeListing } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller();
    const body = await request.json();
    const data = optimizeListingSchema.parse(body);
    
    const result = await optimizeListing(
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
