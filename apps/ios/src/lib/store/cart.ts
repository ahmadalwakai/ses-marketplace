import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity }] };
    }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  increment: (id) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i)),
    })),
  decrement: (id) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))
        .filter((i) => i.quantity > 0),
    })),
  clear: () => set({ items: [] }),
}));
