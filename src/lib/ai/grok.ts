import prisma from '@/lib/prisma';
import crypto from 'crypto';

const GROK_API_KEY = process.env.GROK_API_KEY!;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

// ============================================
// AI RATE LIMITING (in-memory, per-process)
// ============================================
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Check AI-specific rate limit per key.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export function checkAiRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 3_600_000
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true };
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call Grok AI API
 */
async function callGrok(
  messages: GrokMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<GrokResponse> {
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

/**
 * Log AI usage for tracking and rate limiting
 */
async function logAiUsage(
  tool: string,
  promptHash: string,
  responseSummary: string,
  tokensIn?: number,
  tokensOut?: number,
  userId?: string
): Promise<void> {
  await prisma.aiLog.create({
    data: {
      userId,
      tool,
      promptHash,
      responseSummary: responseSummary.slice(0, 500),
      tokensIn,
      tokensOut,
    },
  });
}

/**
 * Generate a hash of the prompt for deduplication
 */
function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

// ============================================
// AI TOOLS
// ============================================

export interface ModerationResult {
  approved: boolean;
  reason?: string;
  suggestions?: string[];
}

/**
 * Moderate a product listing for inappropriate content
 */
export async function moderateListing(
  title: string,
  description: string,
  category?: string,
  userId?: string
): Promise<ModerationResult> {
  const prompt = `أنت نظام فحص محتوى لسوق سوري إلكتروني. افحص القائمة التالية وحدد إذا كانت مناسبة للنشر.

العنوان: ${title}
الوصف: ${description}
${category ? `الفئة: ${category}` : ''}

قيّم القائمة بناءً على:
1. لا يوجد محتوى غير قانوني أو محظور
2. لا يوجد لغة مسيئة أو عنصرية
3. لا يوجد خداع أو تضليل واضح
4. المعلومات كافية وواضحة

أجب بتنسيق JSON فقط:
{
  "approved": true/false,
  "reason": "السبب إذا لم تتم الموافقة",
  "suggestions": ["اقتراحات للتحسين"]
}`;

  const messages: GrokMessage[] = [
    { role: 'system', content: 'أنت مساعد ذكي لفحص محتوى المنتجات. أجب بتنسيق JSON فقط.' },
    { role: 'user', content: prompt },
  ];
  
  const response = await callGrok(messages, { temperature: 0.3 });
  const content = response.choices[0]?.message?.content || '{}';
  
  // Log usage
  await logAiUsage(
    'moderate-listing',
    hashPrompt(prompt),
    content.slice(0, 200),
    response.usage?.prompt_tokens,
    response.usage?.completion_tokens,
    userId
  );
  
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { approved: true };
  } catch {
    console.error('Failed to parse moderation response:', content);
    return { approved: true }; // Default to approved if parsing fails
  }
}

export interface OptimizedListing {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Optimize a product listing for better visibility (Arabic)
 */
export async function optimizeListing(
  title: string,
  description: string,
  category?: string,
  userId?: string
): Promise<OptimizedListing> {
  const prompt = `أنت خبير تسويق إلكتروني. حسّن قائمة المنتج التالية للسوق السوري.

العنوان الحالي: ${title}
الوصف الحالي: ${description}
${category ? `الفئة: ${category}` : ''}

قدم:
1. عنوان محسّن (أقصر وأوضح ويحتوي كلمات مفتاحية)
2. وصف محسّن (أكثر جاذبية ووضوحاً)
3. كلمات مفتاحية (5-10 كلمات)

أجب بتنسيق JSON فقط:
{
  "title": "العنوان المحسّن",
  "description": "الوصف المحسّن",
  "tags": ["كلمة1", "كلمة2"]
}`;

  const messages: GrokMessage[] = [
    { role: 'system', content: 'أنت خبير تسويق محترف. أجب بالعربية وبتنسيق JSON فقط.' },
    { role: 'user', content: prompt },
  ];
  
  const response = await callGrok(messages, { temperature: 0.7, maxTokens: 1500 });
  const content = response.choices[0]?.message?.content || '{}';
  
  // Log usage
  await logAiUsage(
    'optimize-listing',
    hashPrompt(prompt),
    content.slice(0, 200),
    response.usage?.prompt_tokens,
    response.usage?.completion_tokens,
    userId
  );
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        title: result.title || title,
        description: result.description || description,
        tags: Array.isArray(result.tags) ? result.tags : [],
      };
    }
    return { title, description, tags: [] };
  } catch {
    console.error('Failed to parse optimization response:', content);
    return { title, description, tags: [] };
  }
}

export interface SmartSearchResult {
  expandedQuery: string;
  suggestedFilters: {
    categories?: string[];
    priceRange?: { min?: number; max?: number };
    conditions?: string[];
  };
  relatedTerms: string[];
}

/**
 * Smart search query expansion and filter suggestions (Arabic)
 */
export async function smartSearch(
  query: string,
  language: 'ar' | 'en' = 'ar',
  userId?: string
): Promise<SmartSearchResult> {
  const prompt = language === 'ar' 
    ? `أنت محرك بحث ذكي لسوق إلكتروني سوري. المستخدم يبحث عن:

"${query}"

قدم:
1. استعلام موسّع يتضمن مرادفات وكلمات ذات صلة
2. فلاتر مقترحة (فئات، نطاق سعري، حالة المنتج)
3. كلمات بحث ذات صلة

أجب بتنسيق JSON:
{
  "expandedQuery": "الاستعلام الموسّع",
  "suggestedFilters": {
    "categories": ["فئة1"],
    "priceRange": {"min": 0, "max": 1000000},
    "conditions": ["NEW", "LIKE_NEW"]
  },
  "relatedTerms": ["كلمة1", "كلمة2"]
}`
    : `You are a smart search engine for a Syrian e-commerce marketplace. The user searches for:

"${query}"

Provide:
1. Expanded query with synonyms and related terms
2. Suggested filters (categories, price range, condition)
3. Related search terms

Reply in JSON format:
{
  "expandedQuery": "expanded query",
  "suggestedFilters": {
    "categories": ["category1"],
    "priceRange": {"min": 0, "max": 1000000},
    "conditions": ["NEW", "LIKE_NEW"]
  },
  "relatedTerms": ["term1", "term2"]
}`;

  const messages: GrokMessage[] = [
    { role: 'system', content: 'You are a helpful search assistant. Reply in JSON only.' },
    { role: 'user', content: prompt },
  ];
  
  const response = await callGrok(messages, { temperature: 0.5 });
  const content = response.choices[0]?.message?.content || '{}';
  
  // Log usage
  await logAiUsage(
    'smart-search',
    hashPrompt(prompt),
    content.slice(0, 200),
    response.usage?.prompt_tokens,
    response.usage?.completion_tokens,
    userId
  );
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        expandedQuery: result.expandedQuery || query,
        suggestedFilters: result.suggestedFilters || {},
        relatedTerms: Array.isArray(result.relatedTerms) ? result.relatedTerms : [],
      };
    }
    return { expandedQuery: query, suggestedFilters: {}, relatedTerms: [] };
  } catch {
    console.error('Failed to parse search response:', content);
    return { expandedQuery: query, suggestedFilters: {}, relatedTerms: [] };
  }
}

export default {
  moderateListing,
  optimizeListing,
  smartSearch,
};
