import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import { smartSearchSchema } from '@/lib/validations';
import { success, handleError } from '@/lib/api-response';
import { smartSearch } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    // Smart search is available to anyone, but we track usage for logged-in users
    const user = await getAuthUser();
    const body = await request.json();
    const data = smartSearchSchema.parse(body);
    
    const result = await smartSearch(
      data.query,
      data.language,
      user?.id
    );
    
    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
