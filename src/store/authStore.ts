import { create } from "zustand";

export type AuthState = {
  accessToken?: string;
  refreshToken?: string;
};

type Actions = {
  setAccessToken(token: string | undefined): void;
  setRefreshToken(token: string | undefined): void;
};

export const useAuthStore = create<AuthState & Actions>((set, get) => ({
  accessToken: undefined,
  refreshToken: undefined,
  setAccessToken: (accessToken) => set({ accessToken }),
  setRefreshToken: (refreshToken) => set({ refreshToken }),
}));

// For places where you’re not inside React (e.g., router loaders, handlers)
export const authStore = {
  get: () => useAuthStore.getState(),
  set: (partial: Partial<AuthState>) => useAuthStore.setState(partial),
  subscribe: useAuthStore.subscribe,
};
