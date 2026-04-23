import { environment } from "@/environment";
import PlatformSecureStore from "@/src/helpers/secureStore";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type FetchError = {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  url: string;
  headers: Record<string, string>;
  requestBody: unknown;
  status?: number;
  error: unknown;
};

export type ReactError = {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
};

type DebugState = {
  debugEnabled: boolean;
  backendUrlOverride: string | null;
  debugAccessToken: string | null;
  debugRefreshToken: string | null;
  fetchErrors: FetchError[];
  reactErrors: ReactError[];
};

type Actions = {
  setDebugEnabled(enabled: boolean): void;
  setBackendUrlOverride(url: string | null): void;
  setDebugTokens(access: string | null, refresh: string | null): void;
  clearDebugTokens(): void;
  addFetchError(e: Omit<FetchError, "id" | "timestamp">): void;
  clearFetchErrors(): void;
  addReactError(e: Omit<ReactError, "id" | "timestamp">): void;
  clearReactErrors(): void;
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

const debugPersistStorage = createJSONStorage(() => ({
  getItem: (key: string) => PlatformSecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    PlatformSecureStore.setItemAsync(key, value),
  removeItem: (key: string) => PlatformSecureStore.deleteItemAsync(key),
}));

export const useDebugStore = create<DebugState & Actions>()(
  persist(
    (set) => ({
      debugEnabled: false,
      backendUrlOverride: null,
      debugAccessToken: null,
      debugRefreshToken: null,
      fetchErrors: [],
      reactErrors: [],
      setDebugEnabled: (enabled) => set({ debugEnabled: enabled }),
      setBackendUrlOverride: (url) => set({ backendUrlOverride: url }),
      setDebugTokens: (access, refresh) =>
        set({ debugAccessToken: access, debugRefreshToken: refresh }),
      clearDebugTokens: () =>
        set({ debugAccessToken: null, debugRefreshToken: null }),
      addFetchError: (e) =>
        set((s) => ({
          fetchErrors: [
            { ...e, id: newId(), timestamp: now() },
            ...s.fetchErrors,
          ],
        })),
      clearFetchErrors: () => set({ fetchErrors: [] }),
      addReactError: (e) =>
        set((s) => ({
          reactErrors: [
            { ...e, id: newId(), timestamp: now() },
            ...s.reactErrors,
          ],
        })),
      clearReactErrors: () => set({ reactErrors: [] }),
    }),
    {
      name: "debug_store",
      storage: debugPersistStorage,
      partialize: ({
        debugEnabled,
        backendUrlOverride,
        debugAccessToken,
        debugRefreshToken,
      }) => ({
        debugEnabled,
        backendUrlOverride,
        debugAccessToken,
        debugRefreshToken,
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
        message: error?.message ?? String(error),
        stack: error?.stack,
      });
    }
    originalHandler(error, isFatal);
  });
}
