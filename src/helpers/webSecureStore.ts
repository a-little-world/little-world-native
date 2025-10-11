/**
 * Web-compatible SecureStore implementation for development only
 * Simple localStorage wrapper that emulates expo-secure-store API
 * NOT SECURE - for development/testing purposes only
 */

export class WebSecureStore {
  private static readonly STORAGE_PREFIX = 'dev_secure_';

  private static getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  /**
   * Get an item from secure storage
   */
  static async getItemAsync(key: string): Promise<string | null> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('WebSecureStore: localStorage not available');
        return null;
      }

      const storageKey = this.getStorageKey(key);
      return localStorage.getItem(storageKey);
    } catch (error) {
      console.warn('WebSecureStore.getItemAsync failed:', error);
      return null;
    }
  }

  /**
   * Set an item in secure storage
   */
  static async setItemAsync(key: string, value: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('WebSecureStore: localStorage not available');
        return;
      }

      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, value);
    } catch (error) {
      console.warn('WebSecureStore.setItemAsync failed:', error);
      throw error;
    }
  }

  /**
   * Delete an item from secure storage
   */
  static async deleteItemAsync(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('WebSecureStore: localStorage not available');
        return;
      }

      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('WebSecureStore.deleteItemAsync failed:', error);
      throw error;
    }
  }

  /**
   * Check if secure storage is available
   */
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  /**
   * Clear all secure storage items
   */
  static async clearAllAsync(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        console.warn('WebSecureStore: localStorage not available');
        return;
      }

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('WebSecureStore.clearAllAsync failed:', error);
      throw error;
    }
  }
}

// Export as default to match expo-secure-store structure
export default WebSecureStore;
