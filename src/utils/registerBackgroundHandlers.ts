import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from 'react-native-notify-kit';

import {
  cancelIncomingCall,
  createIncomingCallChannel,
  declineCall,
  displayIncomingCall,
  parseCallPush,
} from '@/src/utils/incomingCall';

// Incoming calls arrive on Android as data-only FCM messages so that we, not the
// system tray, own the presentation - a `notification` block would be rendered
// by the OS and this handler would never run, which rules out a full-screen
// intent. In a backgrounded or killed app the message is delivered here and
// nowhere else, so this module is required from index.js ahead of the router.
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  const parsed = parseCallPush(remoteMessage.data);
  if (!parsed) {
    return;
  }

  if (parsed.type === 'call_cancelled') {
    await cancelIncomingCall(parsed.call.sessionId);
    return;
  }

  await createIncomingCallChannel();
  await displayIncomingCall(parsed.call);
});

// Notification presses while the app is backgrounded or killed.
//
// Only 'decline' is handled here, because declining is the one action that must
// work without ever opening the app. Accept and a plain body press both carry
// `launchActivity: 'default'`, and the full-screen intent launches the activity
// with no event at all, so in every other case the app is already coming to the
// front and recovers the ringing call from getDisplayedIncomingCall() on boot.
//
// ponytail: this costs one extra tap - pressing Accept on the notification lands
// on the in-app overlay instead of going straight into the call. If that grates,
// persist an "accepted" marker here and consume it at startup.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.ACTION_PRESS) {
    return;
  }
  if (detail.pressAction?.id !== 'decline') {
    return;
  }

  const parsed = parseCallPush(detail.notification?.data);
  if (parsed?.type !== 'incoming_call') {
    return;
  }

  await declineCall(parsed.call);
  await cancelIncomingCall(parsed.call.sessionId);
});
