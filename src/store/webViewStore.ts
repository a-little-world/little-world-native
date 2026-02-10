import { create } from "zustand";

export type WebViewState = {
  ready: boolean;
};

type Actions = {
  setReady(ready: boolean): void;
};

export const useWebViewStore = create<WebViewState & Actions>((set, get) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));

// For places where you’re not inside React (e.g., router loaders, handlers)
export const authStore = {
  get: () => useWebViewStore.getState(),
  set: (partial: Partial<WebViewState>) => useWebViewStore.setState(partial),
  subscribe: useWebViewStore.subscribe,
};
