import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart store (for potential future cart feature)
interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
        } else {
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'ses-cart',
    }
  )
);

// Wishlist store
interface WishlistItem {
  productId: string;
  title: string;
  titleAr?: string;
  price: number;
  image?: string;
  slug: string;
  addedAt: number;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        if (!items.find((i) => i.productId === item.productId)) {
          set({ items: [...items, { ...item, addedAt: Date.now() }] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      isInWishlist: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'ses-wishlist',
    }
  )
);

// Compare store (max 4 items)
interface CompareItem {
  productId: string;
  title: string;
  titleAr?: string;
  price: number;
  image?: string;
  slug: string;
  condition: string;
  category?: string;
  seller?: string;
  rating?: number;
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => boolean;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        if (items.length >= 4) {
          return false; // Max 4 items
        }
        if (!items.find((i) => i.productId === item.productId)) {
          set({ items: [...items, item] });
          return true;
        }
        return false;
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      isInCompare: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },
      clearCompare: () => set({ items: [] }),
    }),
    {
      name: 'ses-compare',
    }
  )
);

// UI store for general app state
interface UIStore {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  mobileFiltersOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileFilters: () => void;
  setMobileFiltersOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  mobileMenuOpen: false,
  mobileFiltersOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileFilters: () => set((state) => ({ mobileFiltersOpen: !state.mobileFiltersOpen })),
  setMobileFiltersOpen: (open) => set({ mobileFiltersOpen: open }),
}));

// Search store
interface SearchStore {
  query: string;
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
  };
  suggestions: { id: string; title: string; slug: string; image?: string }[];
  isSearching: boolean;
  setQuery: (query: string) => void;
  setFilters: (filters: SearchStore['filters']) => void;
  setSuggestions: (suggestions: SearchStore['suggestions']) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearFilters: () => void;
  clearSuggestions: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  filters: {},
  suggestions: [],
  isSearching: false,
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsSearching: (isSearching) => set({ isSearching }),
  clearFilters: () => set({ filters: {} }),
  clearSuggestions: () => set({ suggestions: [] }),
}));
