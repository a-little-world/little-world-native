import { create } from 'zustand';

export type IncomingCall = {
  sessionId: string;
  partnerId: string;
  callerName: string;
  callerImageUrl?: string;
  path: string;
};

export type IncomingCallState = {
  call: IncomingCall | null;
};

type Actions = {
  setCall(call: IncomingCall | null): void;
  clear(): void;
};

export const useIncomingCallStore = create<IncomingCallState & Actions>(
  set => ({
    call: null,
    setCall: call => set({ call }),
    clear: () => set({ call: null }),
  }),
);

// For places where you’re not inside React (e.g., headless background handlers)
export const incomingCallStore = {
  get: () => useIncomingCallStore.getState(),
  set: (partial: Partial<IncomingCallState>) =>
    useIncomingCallStore.setState(partial),
  subscribe: useIncomingCallStore.subscribe,
};
