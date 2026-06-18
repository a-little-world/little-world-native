import { DomCommunicationMessageFn } from "@/frontend/src";
import { create } from "zustand";

interface DomCommunicationState {
  sendToDom?: DomCommunicationMessageFn;
}

type Actions = {
  setSendToDom(fn: DomCommunicationMessageFn | undefined): void;
};

export const useDomCommunicationStore = create<DomCommunicationState & Actions>(
  (set, get) => ({
    sendToDom: undefined,
    setSendToDom: (fn) => set({ sendToDom: fn }),
  }),
);

// For places where you’re not inside React (e.g., router loaders, handlers)
export const domCommunicationStore = {
  get: () => useDomCommunicationStore.getState(),
  set: (partial: Partial<DomCommunicationState>) =>
    useDomCommunicationStore.setState(partial),
  subscribe: useDomCommunicationStore.subscribe,
};
