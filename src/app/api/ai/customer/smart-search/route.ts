import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import { smartSearchSchema } from '@/lib/validations';
import { success, error, handleError } from '@/lib/api-response';
import { smartSearch, checkAiRateLimit } from '@/lib/ai/grok';

export async function POST(request: NextRequest) {
  try {
    // Smart search is available to anyone, but we track usage for logged-in users
    const user = await getAuthUser();

    // AI rate limit: 30 requests per hour per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'anon';
    const limit = checkAiRateLimit(`search:${ip}`, 30);
    if (!limit.allowed) {
      return error(
        `تم تجاوز الحد المسموح للبحث الذكي. حاول مجدداً بعد ${limit.retryAfterSeconds} ثانية`,
        'RATE_LIMITED',
        429
      );
    }

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
