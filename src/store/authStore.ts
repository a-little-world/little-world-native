import { create } from 'zustand';

import { TokenStatus } from '../api/helpers';

export interface TokenState {
  isRefreshing: boolean;
  status?: TokenStatus;
}

export type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  tokenState?: TokenState;
};

type Actions = {
  setAccessToken(token: string | undefined): void;
  setRefreshToken(token: string | undefined): void;
  setTokenState(state: TokenState): void;
};

export const useAuthStore = create<AuthState & Actions>(set => ({
  accessToken: undefined,
  refreshToken: undefined,
  tokenState: undefined,
  setAccessToken: accessToken => set({ accessToken }),
  setRefreshToken: refreshToken => set({ refreshToken }),
  setTokenState: tokenState => set({ tokenState }),
}));

// For places where you’re not inside React (e.g., router loaders, handlers)
export const authStore = {
  get: () => useAuthStore.getState(),
  set: (partial: Partial<AuthState>) => useAuthStore.setState(partial),
  subscribe: useAuthStore.subscribe,
};
