import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Network service for handling connectivity states and offline scenarios.
 * Provides utilities for detecting network changes, blocking API calls when offline,
 * and showing appropriate user feedback.
 */
class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  private initialize() {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      };

      this.currentState = networkState;
      this.notifyListeners(networkState);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      };

      this.currentState = networkState;
      this.notifyListeners(networkState);
    });
  }

  /**
   * Get current network state
   */
  getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if device is online (has internet connectivity)
   */
  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable !== false;
  }

  /**
   * Check if device has any network connection (even without internet)
   */
  hasConnection(): boolean {
    return this.currentState.isConnected;
  }

  /**
   * Subscribe to network state changes
   */
  subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  /**
   * Show offline alert to user
   */
  showOfflineAlert() {
    Alert.alert(
      'No Internet Connection',
      'You appear to be offline. Please check your connection and try again.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Show reconnect alert when coming back online
   */
  showReconnectAlert() {
    Alert.alert(
      'Connection Restored',
      'You\'re back online! You can continue using the app.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Execute a network request with offline handling
   * Throws an error if offline, otherwise executes the request
   */
  async executeWithOfflineCheck<T>(request: () => Promise<T>): Promise<T> {
    if (!this.isOnline()) {
      this.showOfflineAlert();
      throw new Error('No internet connection');
    }

    return request();
  }

  /**
   * Wait for internet connectivity
   * Useful for retry mechanisms
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const unsubscribe = this.subscribe((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          unsubscribe();
          resolve(true);
        }
      });

      // Timeout after specified duration
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);
    });
  }
}

// Export singleton instance
export const networkService = new NetworkService();
export default networkService;
