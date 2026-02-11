import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: string) => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

// Custom storage adapter for SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Handle error silently
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch {
      // Handle error silently
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      isAuthenticated: false,

      login: (token: string, role: string) => {
        set({
          token,
          role,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },

      restoreSession: async () => {
        try {
          const token = await SecureStore.getItemAsync('access_token');
          if (token) {
            // Decode JWT to get role (simple decode, not validation)
            const payload = JSON.parse(atob(token.split('.')[1]));
            set({
              token,
              role: payload.role,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          // Clear invalid token
          await SecureStore.deleteItemAsync('access_token');
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      // Only persist token and role, not computed isAuthenticated
      partialize: (state) => ({
        token: state.token,
        role: state.role,
      }),
    }
  )
);
