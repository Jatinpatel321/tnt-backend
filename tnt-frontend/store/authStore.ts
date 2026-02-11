import { create } from 'zustand';
import { saveToken, getToken, deleteToken } from '../services/token';

// Type definitions
export type UserRole = 'student' | 'vendor' | 'admin';

export interface AuthState {
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
}

// Auth store using Zustand for global state management
export const useAuthStore = create<AuthState & {
  login: (token: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}>((set, get) => ({
  // Initial state
  token: null,
  role: null,
  isAuthenticated: false,
  isBootstrapping: true,

  /**
   * Login user with token and role
   * Persists token securely and updates state
   */
  login: async (token: string, role: UserRole) => {
    try {
      await saveToken(token);
      set({
        token,
        role,
        isAuthenticated: true,
        isBootstrapping: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Failed to save authentication data');
    }
  },

  /**
   * Logout user
   * Clears token from storage and resets state
   */
  logout: async () => {
    try {
      await deleteToken();
      set({
        token: null,
        role: null,
        isAuthenticated: false,
        isBootstrapping: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if delete fails, reset state
      set({
        token: null,
        role: null,
        isAuthenticated: false,
        isBootstrapping: false,
      });
    }
  },

  /**
   * Restore session on app launch
   * Checks for existing token and validates it
   */
  restoreSession: async () => {
    try {
      const token = await getToken();
      if (token) {
        // Decode JWT to extract role from payload
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role as UserRole;
          set({
            token,
            role,
            isAuthenticated: true,
            isBootstrapping: false,
          });
        } catch (decodeError) {
          // Invalid token format, clear it
          console.warn('Invalid token format, clearing session');
          await deleteToken();
          set({
            token: null,
            role: null,
            isAuthenticated: false,
            isBootstrapping: false,
          });
        }
      } else {
        set({ isBootstrapping: false });
      }
    } catch (error) {
      console.error('Session restore failed:', error);
      set({ isBootstrapping: false });
    }
  },
}));
