import React, { createContext, useContext } from 'react';
import { useAppStateStore } from './appStateStore';

interface AppStateContextType {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline, isLoading, error, setOnline, setLoading, setError, clearError } = useAppStateStore();

  const value = {
    isOnline,
    isLoading,
    error,
    setOnline,
    setLoading,
    setError,
    clearError,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
