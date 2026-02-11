// Custom hook for authentication
// Provides authentication state and actions

import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { token, role, isAuthenticated, login, logout, restoreSession } = useAuthStore();

  return {
    token,
    role,
    isAuthenticated,
    login,
    logout,
    restoreSession,
  };
};
