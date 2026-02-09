import { create } from 'zustand';

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sort?: string;
}

interface SearchState {
  query: string;
  filters: SearchFilters;
  showAdvanced: boolean;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setShowAdvanced: (show: boolean) => void;
  toggleAdvanced: () => void;
  clearFilters: () => void;
  clearAll: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: {},
  showAdvanced: false,
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setShowAdvanced: (show) => set({ showAdvanced: show }),
  toggleAdvanced: () => set((state) => ({ showAdvanced: !state.showAdvanced })),
  clearFilters: () => set({ filters: {} }),
  clearAll: () => set({ query: '', filters: {}, showAdvanced: false }),
}));
