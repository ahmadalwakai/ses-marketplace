const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ses-marketplace.vercel.app').replace(/\/$/, '');

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  authCookie?: string | null;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${normalized}`;
};

export const extractSessionCookie = (setCookieHeader: string | null): string | null => {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(/((?:__Secure-)?next-auth\.session-token)=([^;]+)/);
  if (!match) return null;
  return `${match[1]}=${match[2]}`;
};

const toJson = (value: string) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value as unknown as null;
  }
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, authCookie } = options;
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (authCookie) {
    finalHeaders.Cookie = authCookie;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  });

  const raw = await response.text();
  const data = toJson(raw) as T;

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message || 'حدث خطأ غير متوقع';
    throw new Error(message);
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  };
}

export const apiClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: RequestOptions['body'], opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, body, method: 'POST' }),
  put: <T>(path: string, body?: RequestOptions['body'], opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, body, method: 'PUT' }),
  patch: <T>(path: string, body?: RequestOptions['body'], opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, body, method: 'PATCH' }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'DELETE' }),
};
