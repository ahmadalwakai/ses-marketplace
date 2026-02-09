import { create } from 'zustand';
import { fetchSession, login as apiLogin, logout as apiLogout } from '../api/auth';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  sessionCookie: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
  setSessionCookie: (cookie: string | null) => void;
}

const initialState: Pick<AuthState, 'user' | 'sessionCookie' | 'loading' | 'error'> = {
  user: null,
  sessionCookie: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,
  setSessionCookie: (cookie) => set({ sessionCookie: cookie }),
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { sessionCookie, session } = await apiLogin({ email, password });
      set({
        sessionCookie: sessionCookie || null,
        user: (session as { user?: User } | null)?.user || null,
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
  hydrate: async () => {
    const cookie = get().sessionCookie;
    if (!cookie) return;
    set({ loading: true, error: null });
    try {
      const { data } = await fetchSession(cookie);
      set({ user: data?.user || null, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
  signOut: async () => {
    const cookie = get().sessionCookie;
    if (!cookie) {
      set({ user: null, sessionCookie: null });
      return;
    }
    try {
      await apiLogout(cookie);
    } finally {
      set({ user: null, sessionCookie: null });
    }
  },
}));

export const getAuthCookie = () => useAuthStore.getState().sessionCookie;
