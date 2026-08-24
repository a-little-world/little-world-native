import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import i18next from 'i18next';
import notifee, { EventType } from 'react-native-notify-kit';

import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { incomingCallStore } from '@/src/store/incomingCallStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';
import {
  cancelIncomingCall,
  createIncomingCallChannel,
  displayIncomingCall,
  getDisplayedIncomingCall,
  parseCallPush,
} from '@/src/utils/incomingCall';
import {
  acceptIncomingCall,
  rejectIncomingCall,
} from '@/src/utils/incomingCallActions';
import {
  extractPath,
  flushPendingPath,
  openPath,
} from '@/src/utils/navigateToDom';
import {
  ensureNotificationPermission,
  setUpNotificationChannels,
} from '@/src/utils/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// iOS has no full-screen incoming call UI outside CallKit, which is
// architecturally incompatible with the WebView our call screen lives in. The
// ring is therefore a time-sensitive alert push carrying these two actions.
const IOS_CALL_CATEGORY = 'INCOMING_CALL';

async function setUpIosCallCategory() {
  if (Platform.OS !== 'ios') {
    return;
  }
  await Notifications.setNotificationCategoryAsync(IOS_CALL_CATEGORY, [
    {
      identifier: 'decline',
      buttonTitle: i18next.t('incoming_call.decline'),
      options: { opensAppToForeground: false, isDestructive: true },
    },
    {
      identifier: 'accept',
      buttonTitle: i18next.t('incoming_call.accept'),
      options: { opensAppToForeground: true },
    },
  ]);
}

async function handleCallPush(
  parsed: NonNullable<ReturnType<typeof parseCallPush>>,
) {
  if (parsed.type === 'call_cancelled') {
    await cancelIncomingCall(parsed.call.sessionId);
    return;
  }

  // The webapp's own WebSocket already owns the foreground case - it opens the
  // in-app INCOMING_CALL modal off `addActiveCallRoom` - so ringing natively on
  // top of that would double up.
  if (useWebViewStore.getState().ready && AppState.currentState === 'active') {
    return;
  }

  await createIncomingCallChannel();
  await displayIncomingCall(parsed.call);
  incomingCallStore.get().setCall(parsed.call);
}

async function clearNotifications() {
  // A ringing call must survive this sweep: the Android full-screen intent
  // foregrounds the app, which would otherwise dismiss the very notification the
  // overlay reconstructs itself from. Pick the call up first, then leave it
  // alone - it is cancelled explicitly on accept, decline, timeout or cancel
  // push.
  const ringing = await getDisplayedIncomingCall();
  if (ringing) {
    incomingCallStore.get().setCall(ringing);
    return;
  }

  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

function FireBase() {
  const webViewReady = useWebViewStore(state => state.ready);

  useEffect(() => {
    if (!webViewReady) {
      return;
    }
    flushPendingPath();
  }, [webViewReady]);

  useEffect(() => {
    const messaging = getMessaging();

    (async () => {
      try {
        await setUpNotificationChannels();
        await createIncomingCallChannel();
        await setUpIosCallCategory();
        const granted = await ensureNotificationPermission();
        if (!granted) {
          console.warn('[push] notification permission not granted');
        }
      } catch (error) {
        console.error('[push] setup failed', error);
      }
    })();

    const messageUnsubscribe = onMessage(messaging, async remoteMessage => {
      const parsed = parseCallPush(remoteMessage.data);
      if (parsed) {
        await handleCallPush(parsed);
        return;
      }

      if (!remoteMessage.notification) {
        return;
      }
      domCommunicationStore.get().sendToDom?.({
        action: 'DISPLAY_NOTIFICATION',
        payload: {
          title: remoteMessage.notification.title ?? undefined,
          body: remoteMessage.notification.body ?? undefined,
          path: extractPath(remoteMessage.data) ?? undefined,
        },
      });
    });

    // Android notification presses while the app is in the foreground. The
    // background counterpart lives in src/utils/registerBackgroundHandlers.ts.
    const notifeeUnsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type !== EventType.ACTION_PRESS && type !== EventType.PRESS) {
        return;
      }
      const parsed = parseCallPush(detail.notification?.data);
      if (parsed?.type !== 'incoming_call') {
        return;
      }
      if (detail.pressAction?.id === 'decline') {
        rejectIncomingCall(parsed.call);
      } else {
        incomingCallStore.get().setCall(parsed.call);
      }
    });

    const openedUnsubscribe = onNotificationOpenedApp(
      messaging,
      remoteMessage => openPath(extractPath(remoteMessage.data)),
    );
    getInitialNotification(messaging).then(remoteMessage =>
      openPath(extractPath(remoteMessage?.data)),
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(response =>
        handleNotificationResponse(response),
      );
    // The listener alone misses the response that cold-launched the app.
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    const tokenRefreshUnsubscribe = onTokenRefresh(messaging, () =>
      registerFirebaseDeviceToken(),
    );

    // Recover a call that is already ringing - the Android full-screen intent
    // launches the activity without emitting any notification event at all.
    getDisplayedIncomingCall().then(call => {
      if (call) {
        incomingCallStore.get().setCall(call);
      }
    });

    // clear notificaitons upon app open
    clearNotifications();
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        clearNotifications();
      }
    });

    return () => {
      messageUnsubscribe();
      notifeeUnsubscribe();
      openedUnsubscribe();
      responseSubscription.remove();
      tokenRefreshUnsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return <></>;
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
) {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  const parsed = parseCallPush(data);

  if (parsed?.type === 'incoming_call') {
    if (response.actionIdentifier === 'decline') {
      rejectIncomingCall(parsed.call);
    } else {
      acceptIncomingCall(parsed.call);
    }
    return;
  }

  openPath(extractPath(data));
}

export default FireBase;
