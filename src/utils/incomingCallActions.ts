import type { IncomingCall } from '@/src/store/incomingCallStore';
import { incomingCallStore } from '@/src/store/incomingCallStore';
import { cancelIncomingCall, declineCall } from '@/src/utils/incomingCall';
import { openPath } from '@/src/utils/navigateToDom';

// Accepting hands off to the webapp's existing call flow: the path opens the
// call-setup modal for the caller, which is the same route the in-app incoming
// call modal uses. The ring UI is torn down first so it cannot flash back.
export async function acceptIncomingCall(call: IncomingCall): Promise<void> {
  incomingCallStore.get().clear();
  openPath(call.path);
  await cancelIncomingCall(call.sessionId);
}

export async function rejectIncomingCall(call: IncomingCall): Promise<void> {
  incomingCallStore.get().clear();
  await declineCall(call);
  await cancelIncomingCall(call.sessionId);
}
