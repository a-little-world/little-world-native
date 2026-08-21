import { create } from 'zustand';

export interface IncomingCall {
  roomUuid: string;
  partnerId: string;
  partnerName?: string;
  partnerImageUrl?: string;
}

/**
 * `ringing`     – the native screen is asking the user to pick up.
 * `connecting`  – answered; waiting for the WebView to reach the call view.
 */
export type IncomingCallStatus = 'ringing' | 'connecting';

export type IncomingCallState = {
  call: IncomingCall | null;
  status: IncomingCallStatus | null;
};

type Actions = {
  ringIncomingCall(call: IncomingCall): void;
  answerIncomingCall(call?: IncomingCall): void;
  /** Back to the Accept/Decline buttons after a failed handover. */
  resetToRinging(roomUuid: string): void;
  clearIncomingCall(roomUuid?: string): void;
};

export const useIncomingCallStore = create<IncomingCallState & Actions>(
  (set, get) => ({
    call: null,
    status: null,
    ringIncomingCall: call => {
      // A push for a call we already answered must not drag the user back to the
      // ring screen: pushes can arrive late, and the cancel push may never come.
      if (
        get().call?.roomUuid === call.roomUuid &&
        get().status !== 'ringing'
      ) {
        return;
      }
      set({ call, status: 'ringing' });
    },
    answerIncomingCall: call =>
      set(state => {
        const answered = call ?? state.call;
        return answered
          ? { call: answered, status: 'connecting' }
          : { call: null, status: null };
      }),
    // Deliberately not `ringIncomingCall`: that one ignores anything for a call
    // already past ringing, which is exactly the state being recovered from.
    resetToRinging: roomUuid =>
      set(state =>
        state.call?.roomUuid === roomUuid ? { status: 'ringing' } : state,
      ),
    clearIncomingCall: roomUuid =>
      set(state =>
        // Guard so a stale cancel cannot dismiss a newer call.
        roomUuid && state.call && state.call.roomUuid !== roomUuid
          ? state
          : { call: null, status: null },
      ),
  }),
);

// For the push handlers, which run outside React (and, on Android, sometimes
// without any React tree at all).
export const incomingCallStore = {
  get: () => useIncomingCallStore.getState(),
  subscribe: useIncomingCallStore.subscribe,
};
