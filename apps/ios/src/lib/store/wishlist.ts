import { create } from 'zustand';

export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  image?: string;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  toggle: (item) => {
    const exists = get().items.some((i) => i.id === item.id);
    if (exists) {
      set({ items: get().items.filter((i) => i.id !== item.id) });
    } else {
      set({ items: [...get().items, item] });
    }
  },
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
}));
