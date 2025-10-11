/**
 * Platform-aware SecureStore implementation
 * Automatically switches between native expo-secure-store and web-compatible implementation
 * Web implementation is for development only - NOT SECURE
 */

import { Platform } from 'react-native';
import { WebSecureStore } from './webSecureStore';

// Import native SecureStore
let NativeSecureStore: any = null;
try {
  NativeSecureStore = require('expo-secure-store');
} catch (error) {
  console.log('expo-secure-store not available, using web implementation');
}

/**
 * Platform-aware SecureStore that automatically chooses the right implementation
 */
class PlatformSecureStore {
  private static getSecureStore() {
    if (Platform.OS === 'web') {
      return WebSecureStore;
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && NativeSecureStore) {
      return NativeSecureStore;
    } else {
      // Fallback to web implementation if native is not available
      console.warn('Native SecureStore not available, falling back to web implementation');
      return WebSecureStore;
    }
  }
  
  /**
   * Get an item from secure storage
   */
  static async getItemAsync(key: string): Promise<string | null> {
    const secureStore = this.getSecureStore();
    return secureStore.getItemAsync(key);
  }

  /**
   * Set an item in secure storage
   */
  static async setItemAsync(key: string, value: string): Promise<void> {
    const secureStore = this.getSecureStore();
    return secureStore.setItemAsync(key, value);
  }

  /**
   * Delete an item from secure storage
   */
  static async deleteItemAsync(key: string): Promise<void> {
    const secureStore = this.getSecureStore();
    return secureStore.deleteItemAsync(key);
  }

  /**
   * Check if secure storage is available
   */
  static isAvailable(): boolean {
    const secureStore = this.getSecureStore();
    if (Platform.OS === 'web') {
      return WebSecureStore.isAvailable();
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && NativeSecureStore) {
      return true; // Native SecureStore is always available if imported
    }
    return false;
  }

  /**
   * Get the current platform being used
   */
  static getPlatform(): 'web' | 'native' | 'fallback' {
    if (Platform.OS === 'web') {
      return 'web';
    } else if ((Platform.OS === 'ios' || Platform.OS === 'android') && NativeSecureStore) {
      return 'native';
    } else {
      return 'fallback';
    }
  }
}

// Export as default to match expo-secure-store structure
export default PlatformSecureStore;

// Also export individual methods for convenience
export const getItemAsync = PlatformSecureStore.getItemAsync.bind(PlatformSecureStore);
export const setItemAsync = PlatformSecureStore.setItemAsync.bind(PlatformSecureStore);
export const deleteItemAsync = PlatformSecureStore.deleteItemAsync.bind(PlatformSecureStore);
export const isAvailable = PlatformSecureStore.isAvailable.bind(PlatformSecureStore);
export const getPlatform = PlatformSecureStore.getPlatform.bind(PlatformSecureStore);
