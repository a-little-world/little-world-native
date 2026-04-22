import { environment } from "@/environment";
import PlatformSecureStore from "@/src/helpers/secureStore";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type DebugState = {
  backendUrlOverride: string | null;
  debugAccessToken: string | null;
  debugRefreshToken: string | null;
};

type Actions = {
  setBackendUrlOverride(url: string | null): void;
  setDebugTokens(access: string | null, refresh: string | null): void;
  clearDebugTokens(): void;
};

const debugPersistStorage = createJSONStorage(() => ({
  getItem: (key: string) => PlatformSecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    PlatformSecureStore.setItemAsync(key, value),
  removeItem: (key: string) => PlatformSecureStore.deleteItemAsync(key),
}));

export const useDebugStore = create<DebugState & Actions>()(
  persist(
    (set) => ({
      backendUrlOverride: null,
      debugAccessToken: null,
      debugRefreshToken: null,
      setBackendUrlOverride: (url) => set({ backendUrlOverride: url }),
      setDebugTokens: (access, refresh) =>
        set({ debugAccessToken: access, debugRefreshToken: refresh }),
      clearDebugTokens: () =>
        set({ debugAccessToken: null, debugRefreshToken: null }),
    }),
    {
      name: "debug_store",
      storage: debugPersistStorage,
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
