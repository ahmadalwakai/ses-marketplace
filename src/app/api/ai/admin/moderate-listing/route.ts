import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { moderateListingSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { moderateListing, checkAiRateLimit } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    // AI rate limit: 60 requests per hour per admin
    const limit = checkAiRateLimit(`moderate:${user.id}`, 60);
    if (!limit.allowed) {
      return error(
        `تم تجاوز الحد المسموح. حاول مجدداً بعد ${limit.retryAfterSeconds} ثانية`,
        'RATE_LIMITED',
        429
      );
    }

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
