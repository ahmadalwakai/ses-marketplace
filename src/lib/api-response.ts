import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './rbac';

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success response
 */
export function success<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

/**
 * Create an error response
 */
export function error(
  message: string,
  code: string = 'ERROR',
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorObj: { code: string; message: string; details?: unknown } = { code, message };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return NextResponse.json(
    {
      ok: false,
      error: errorObj,
    },
    { status }
  );
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(err: unknown): NextResponse<ApiErrorResponse> {
  console.error('API Error:', err);
  
  if (err instanceof AuthError) {
    return error(err.message, err.code, err.statusCode);
  }
  
  if (err instanceof ZodError) {
    const firstError = err.errors[0];
    const message = firstError?.message || 'خطأ في البيانات المدخلة';
    return error(message, 'VALIDATION_ERROR', 400, err.errors);
  }
  
  if (err instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'حدث خطأ داخلي' 
      : err.message;
    return error(message, 'INTERNAL_ERROR', 500);
  }
  
  return error('حدث خطأ غير متوقع', 'UNKNOWN_ERROR', 500);
}

/**
 * Pagination helper
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Paginated response helper
 */
export function paginated<T>(
  items: T[],
  pagination: PaginationMeta
): NextResponse<ApiSuccessResponse<{ items: T[]; pagination: PaginationMeta }>> {
  return success({ items, pagination });
}
