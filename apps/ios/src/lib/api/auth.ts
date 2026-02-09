import { apiClient, extractSessionCookie } from './client';

export interface Credentials {
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface RegisterPayload extends Credentials {
  name?: string;
}

export const login = async (payload: Credentials) => {
  const response = await apiClient.post<{ user?: unknown; message?: string }>('/api/auth/callback/credentials', payload);
  const sessionCookie = extractSessionCookie(response.headers.get('set-cookie'));
  return { sessionCookie, session: response.data };
};

export const register = async (payload: RegisterPayload) =>
  apiClient.post<{ userId: string; email: string }>('/api/auth/register', payload);

export const fetchSession = async (authCookie?: string | null) =>
  apiClient.get<{ user?: unknown; expires?: string }>('/api/auth/session', { authCookie: authCookie || undefined });

export const sendResetEmail = async (email: string) =>
  apiClient.post<{ message?: string }>('/api/auth/forgot-password', { email });

export const resetPassword = async (token: string, password: string) =>
  apiClient.post<{ message?: string }>('/api/auth/reset-password', { token, password });

export const logout = async (authCookie?: string | null) =>
  apiClient.post('/api/auth/signout', {}, { authCookie: authCookie || undefined });

export const googleAuthUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ses-marketplace.vercel.app'}/api/auth/signin?provider=google`;
