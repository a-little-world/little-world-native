import { create } from 'zustand';

/**
 * Set while the app is only on screen because a call arrived on a locked phone.
 * The webapp restricts itself to the call routes for as long as it is set - see
 * the SET_LOCKED_SESSION bridge action.
 */
export type LockedSessionState = {
  locked: boolean;
};

type Actions = {
  setLocked(locked: boolean): void;
};

export const useLockedSessionStore = create<LockedSessionState & Actions>(
  set => ({
    locked: false,
    setLocked: locked => set({ locked }),
  }),
);

// For places where you're not inside React (e.g., headless background handlers)
export const lockedSessionStore = {
  get: () => useLockedSessionStore.getState(),
  set: (partial: Partial<LockedSessionState>) =>
    useLockedSessionStore.setState(partial),
  subscribe: useLockedSessionStore.subscribe,
};
