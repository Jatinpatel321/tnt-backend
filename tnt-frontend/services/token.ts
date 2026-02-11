import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use SecureStore for native platforms (iOS/Android) and AsyncStorage for web
// SecureStore provides encrypted storage on native platforms
// AsyncStorage works on all platforms including web
const TOKEN_KEY = 'auth_token';

/**
 * Securely save JWT token
 * @param token - JWT token string
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Failed to save token:', error);
    throw new Error('Failed to save authentication token');
  }
};

/**
 * Retrieve JWT token from storage
 * @returns Promise<string | null> - Token or null if not found
 */
export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
};

/**
 * Delete JWT token from storage
 */
export const deleteToken = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Failed to delete token:', error);
    // Don't throw here as logout should succeed even if delete fails
  }
};
