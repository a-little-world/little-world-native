import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { environment } from '@/environment';
import * as SecureStore from '@/src/helpers/secureStore';

export type NetworkRequest = {
  id: string;
  timestamp: string;
  source: 'frontend' | 'native';
  method: string;
  endpoint: string;
  url: string;
  headers: Record<string, string>;
  requestBody: unknown;
  status?: number;
  durationMs?: number;
  responseBody?: string;
  error?: unknown;
};

const MAX_NETWORK_REQUESTS = 200;

export const isFailedRequest = (r: NetworkRequest) =>
  r.error != null || r.status == null || r.status >= 400;

export type ReactError = {
  id: string;
  timestamp: string;
  source: 'frontend' | 'native';
  message: string;
  stack?: string;
};

type DebugState = {
  debugEnabled: boolean;
  backendUrlOverride: string | null;
  debugAccessToken: string | null;
  debugRefreshToken: string | null;
  bypassIntegrityChecks: boolean;
  integrityBypassToken: string | null;
  logNetworkErrors: boolean;
  logNetworkSuccesses: boolean;
  networkRequests: NetworkRequest[];
  reactErrors: ReactError[];
};

type Actions = {
  setDebugEnabled(enabled: boolean): void;
  setBackendUrlOverride(url: string | null): void;
  setDebugTokens(access: string | null, refresh: string | null): void;
  clearDebugTokens(): void;
  setBypassIntegrityChecks(enabled: boolean): void;
  setIntegrityBypassToken(token: string | null): void;
  addNetworkRequest(e: Omit<NetworkRequest, 'id' | 'timestamp'>): void;
  clearNetworkRequests(failed: boolean): void;
  addReactError(e: Omit<ReactError, 'id' | 'timestamp'>): void;
  clearReactErrors(): void;
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

const debugPersistStorage = createJSONStorage(() => ({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}));

export const useDebugStore = create<DebugState & Actions>()(
  persist(
    set => ({
      debugEnabled: false,
      backendUrlOverride: null,
      debugAccessToken: null,
      debugRefreshToken: null,
      bypassIntegrityChecks: false,
      integrityBypassToken: null,
      logNetworkErrors: true,
      logNetworkSuccesses: false,
      networkRequests: [],
      reactErrors: [],
      setDebugEnabled: enabled => set({ debugEnabled: enabled }),
      setBackendUrlOverride: url => set({ backendUrlOverride: url }),
      setDebugTokens: (access, refresh) =>
        set({ debugAccessToken: access, debugRefreshToken: refresh }),
      clearDebugTokens: () =>
        set({ debugAccessToken: null, debugRefreshToken: null }),
      setBypassIntegrityChecks: enabled =>
        set({ bypassIntegrityChecks: enabled }),
      setIntegrityBypassToken: token => set({ integrityBypassToken: token }),
      addNetworkRequest: e =>
        set(s => ({
          networkRequests: [
            { ...e, id: newId(), timestamp: now() },
            ...s.networkRequests,
          ].slice(0, MAX_NETWORK_REQUESTS),
        })),
      clearNetworkRequests: failed =>
        set(s => ({
          networkRequests: s.networkRequests.filter(
            r => isFailedRequest(r) !== failed,
          ),
        })),
      addReactError: e =>
        set(s => ({
          reactErrors: [
            { ...e, id: newId(), timestamp: now() },
            ...s.reactErrors,
          ],
        })),
      clearReactErrors: () => set({ reactErrors: [] }),
    }),
    {
      name: 'debug_store',
      storage: debugPersistStorage,
      partialize: ({
        debugEnabled,
        backendUrlOverride,
        debugAccessToken,
        debugRefreshToken,
        bypassIntegrityChecks,
        integrityBypassToken,
        logNetworkErrors,
        logNetworkSuccesses,
      }) => ({
        debugEnabled,
        backendUrlOverride,
        debugAccessToken,
        debugRefreshToken,
        bypassIntegrityChecks,
        integrityBypassToken,
        logNetworkErrors,
        logNetworkSuccesses,
      }),
    },
  ),
);

// For places where you're not inside React (e.g., apiFetch, refreshAccessTokens)
export const debugStore = {
  get: () => useDebugStore.getState(),
  set: (partial: Partial<DebugState>) => useDebugStore.setState(partial),
  subscribe: useDebugStore.subscribe,
};

export function getEffectiveBackendUrl(): string {
  return useDebugStore.getState().backendUrlOverride ?? environment.backendUrl;
}

// Call once at startup
export function setupReactErrorTracking() {
  const originalHandler = (ErrorUtils as any).getGlobalHandler();
  (ErrorUtils as any).setGlobalHandler((error: Error, isFatal?: boolean) => {
    if (useDebugStore.getState().debugEnabled) {
      useDebugStore.getState().addReactError({
        source: 'native',
        message: error?.message ?? String(error),
        stack: error?.stack,
      });
    }
    originalHandler(error, isFatal);
  });
}
