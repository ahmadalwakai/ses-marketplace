import { create } from 'zustand';
import { apiClient } from '../api/client';
import { getAuthCookie } from './auth';

interface SellerState {
  products: any[];
  orders: any[];
  earnings: number;
  loading: boolean;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchEarnings: () => Promise<void>;
}

const withAuth = () => ({ authCookie: getAuthCookie() || undefined });

export const useSellerStore = create<SellerState>((set) => ({
  products: [],
  orders: [],
  earnings: 0,
  loading: false,
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<any[]>('/api/seller/products', withAuth());
      set({ products: data || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchOrders: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<any[]>('/api/seller/orders', withAuth());
      set({ orders: data || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchEarnings: async () => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get<{ total: number }>('/api/seller/earnings', withAuth());
      set({ earnings: data?.total || 0, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
