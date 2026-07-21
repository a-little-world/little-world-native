import { create } from 'zustand';

export type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  isTokenRefreshing: boolean;
};

type Actions = {
  setAccessToken(token: string | undefined): void;
  setRefreshToken(token: string | undefined): void;
  setIsTokenRefreshing(isRefreshing: boolean): void;
};

export const useAuthStore = create<AuthState & Actions>((set, get) => ({
  accessToken: undefined,
  refreshToken: undefined,
  isTokenRefreshing: false,
  setAccessToken: accessToken => set({ accessToken }),
  setRefreshToken: refreshToken => set({ refreshToken }),
  setIsTokenRefreshing: isTokenRefreshing => set({ isTokenRefreshing }),
}));

// For places where you’re not inside React (e.g., router loaders, handlers)
export const authStore = {
  get: () => useAuthStore.getState(),
  set: (partial: Partial<AuthState>) => useAuthStore.setState(partial),
  subscribe: useAuthStore.subscribe,
};
