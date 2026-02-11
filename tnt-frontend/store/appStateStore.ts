import { create } from 'zustand';

interface AppStateStore {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStateStore = create<AppStateStore>((set) => ({
  isOnline: true,
  isLoading: false,
  error: null,
  setOnline: (online) => set({ isOnline: online }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
