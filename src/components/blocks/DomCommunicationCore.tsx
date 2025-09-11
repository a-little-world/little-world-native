import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useDomCommunication } from '@/src/hooks/useDomCommunication';
import { type DomResponse } from './LittleWorldWebLazy';

const TOKEN_STORAGE_KEY = 'dom_auth_token';
const TOKEN_TIMESTAMP_KEY = 'dom_auth_token_timestamp';
const ACCESS_TOKEN_KEY = 'dom_auth_access_token';
const REFRESH_TOKEN_KEY = 'dom_auth_refresh_token';

// Fallback storage ( only used if SecureStore / NativeStore not available )
const enhancedStorage = {
  token: '',
  timestamp: '',
  setToken: (token: string) => {
    enhancedStorage.token = token;
    enhancedStorage.timestamp = new Date().toISOString();
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(TOKEN_TIMESTAMP_KEY, enhancedStorage.timestamp);
      }
    } catch {}
  },
  getToken: () => {
    if (enhancedStorage.token) return enhancedStorage.token;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored) {
          enhancedStorage.token = stored;
          enhancedStorage.timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY) || '';
          return stored;
        }
      }
    } catch {}
    return enhancedStorage.token;
  },
  getTimestamp: () => {
    if (enhancedStorage.timestamp) return enhancedStorage.timestamp;
    try {
      if (typeof localStorage !== 'undefined') {
        const ts = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
        if (ts) {
          enhancedStorage.timestamp = ts;
          return ts;
        }
      }
    } catch {}
    return enhancedStorage.timestamp;
  },
  clearToken: () => {
    enhancedStorage.token = '';
    enhancedStorage.timestamp = '';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      }
    } catch {}
  }
};

// Primary storage using SecureStore on native
const secureStorage = {
  setToken: async (token: string) => {
    try {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
        await SecureStore.setItemAsync(TOKEN_TIMESTAMP_KEY, new Date().toISOString());
        return;
      }
      throw new Error('SecureStore not available');
    } catch {
      enhancedStorage.setToken(token);
    }
  },
  getToken: async (): Promise<string | null> => {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      }
      throw new Error('SecureStore not available');
    } catch {
      return enhancedStorage.getToken();
    }
  },
  getTimestamp: async (): Promise<string | null> => {
    try {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(TOKEN_TIMESTAMP_KEY);
      }
      throw new Error('SecureStore not available');
    } catch {
      return enhancedStorage.getTimestamp();
    }
  },
  clearToken: async () => {
    try {
      if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(TOKEN_TIMESTAMP_KEY);
        return;
      }
      throw new Error('SecureStore not available');
    } catch {
      enhancedStorage.clearToken();
    }
  }
};

// Token storage abstraction
const tokenStorage = {
  setToken: async (token: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await secureStorage.setToken(token);
    } else {
      enhancedStorage.setToken(token);
    }
  },
  getToken: async (): Promise<string | null> => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return await secureStorage.getToken();
    } else {
      return enhancedStorage.getToken();
    }
  },
  getTimestamp: async (): Promise<string | null> => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return await secureStorage.getTimestamp();
    } else {
      return enhancedStorage.getTimestamp();
    }
  },
  clearToken: async () => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await secureStorage.clearToken();
    } else {
      enhancedStorage.clearToken();
    }
  }
};

const saveJwtTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {}
};

const getAccessJwtToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
  } catch {}
  return null;
};

const getRefreshJwtToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  } catch {}
  return null;
};

export interface DomCommunicationContextType {
  sendToDom: (action: string, payload?: object) => Promise<DomResponse>;
  domRef: React.RefObject<any>;
  onDomMessage: (action: string, payload?: object) => void;
  sendToReactNative: (action: string, payload?: object) => void;
  tokenStorage: typeof tokenStorage;
  getAccessJwtToken: () => Promise<string | null>;
  getRefreshJwtToken: () => Promise<string | null>;
  saveJwtTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
}

const DomCommunicationContext = createContext<DomCommunicationContextType | null>(null);

export function useDomCommunicationContext() {
  const context = useContext(DomCommunicationContext);
  if (!context) throw new Error('useDomCommunicationContext must be used within a DomCommunicationProvider');
  return context;
}

interface DomCommunicationProviderProps { children: ReactNode }

export function DomCommunicationProvider({ children }: DomCommunicationProviderProps) {
  const domRef = useRef<any>(null);
  const { handleDomResponse, sendToDom } = useDomCommunication();

  const handleDomMessage = useCallback(async (_action: string, _payload?: object): Promise<DomResponse> => {
    return { ok: true };
  }, []);

  const sendToReactNative = useCallback((action: string, payload?: object) => {
    if (action === 'response') {
      handleDomResponse(action, payload);
    } else if (action === 'setTokenFromDom') {
      const p = (payload || {}) as any;
      const accessToken = p?.accessToken ?? p?.token_access ?? p?.token;
      const refreshToken = p?.refreshToken ?? p?.token_refresh ?? null;
      const timestamp = p?.timestamp as string | undefined;
      if (accessToken) {
        void saveJwtTokens(accessToken, refreshToken || undefined);
        void tokenStorage.setToken(accessToken);
        void (async () => {
          try {
            await sendToDom(domRef, 'setAuthToken', { accessToken, refreshToken: refreshToken || undefined, timestamp });
          } catch {}
        })();
      }
    }
  }, [handleDomResponse, sendToDom]);

  const contextValue: DomCommunicationContextType = {
    sendToDom: (action: string, payload?: object) => sendToDom(domRef as React.RefObject<{ receive(action: string, payload?: object): void }>, action, payload),
    domRef,
    onDomMessage: handleDomMessage,
    sendToReactNative,
    tokenStorage,
    getAccessJwtToken,
    getRefreshJwtToken,
    saveJwtTokens,
  };

  return (
    <DomCommunicationContext.Provider value={contextValue}>
      {children}
    </DomCommunicationContext.Provider>
  );
}


