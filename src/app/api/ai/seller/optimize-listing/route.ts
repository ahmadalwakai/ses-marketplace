import { NextRequest } from 'next/server';
import { requireSeller } from '@/lib/rbac';
import { optimizeListingSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { optimizeListing, checkAiRateLimit } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeller();

    // AI rate limit: 10 requests per hour per seller
    const limit = checkAiRateLimit(`optimize:${user.id}`, 10);
    if (!limit.allowed) {
      return error(
        `تم تجاوز الحد المسموح. حاول مجدداً بعد ${limit.retryAfterSeconds} ثانية`,
        'RATE_LIMITED',
        429
      );
    }

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
