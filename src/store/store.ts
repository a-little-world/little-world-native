// src/state/store.ts
import { create } from 'zustand';

export type AppState = {
  user?: { id: string; name: string } | null;
  locale: string;
  unreadCount: number;
};

type Actions = {
  setUser(u: AppState['user']): void;
  setLocale(locale: string): void;
  setUnreadCount(n: number): void;
  incrementUnread(): void;
};

export const useAppStore = create<AppState & Actions>((set, get) => ({
  user: null,
  locale: 'en',
  unreadCount: 0,
  setUser: (user) => set({ user }),
  setLocale: (locale) => set({ locale }),
  setUnreadCount: (n) => set({ unreadCount: n }),
  incrementUnread: () => set({ unreadCount: get().unreadCount + 1 }),
}));

// For places where you’re not inside React (e.g., router loaders, handlers)
export const appStore = {
  get: () => useAppStore.getState(),
  set: (partial: Partial<AppState>) => useAppStore.setState(partial),
  subscribe: useAppStore.subscribe,
};