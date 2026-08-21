import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { useIncomingCallStore } from '@/src/store/incomingCallStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import {
  handleCallNotificationResponse,
  handleCallPushMessage,
  registerCallPushForegroundHandlers,
  restoreIncomingCallOnLaunch,
  setUpIncomingCallCategory,
} from '@/src/utils/callPush';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';
import {
  ensureFullScreenIntentPermission,
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

function extractPath(data?: Record<string, unknown>): string | null {
  const path = data?.path;
  return typeof path === 'string' && path.startsWith('/') ? path : null;
}

// store path from notification in case webview is not ready yet
let pendingPath: string | null = null;

async function openPath(path: string | null) {
  if (!path) {
    return;
  }
  if (!useWebViewStore.getState().ready) {
    pendingPath = path;
    return;
  }

  domCommunicationStore.get().sendToDom?.({
    action: 'NAVIGATE',
    payload: { path },
  });
}

async function clearNotifications() {
  // A ringing call is the one notification that must survive the app coming to
  // the foreground: the user may still be looking at the ring screen.
  if (useIncomingCallStore.getState().status) {
    await Notifications.setBadgeCountAsync(0);
    return;
  }
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

function FireBase() {
  const webViewReady = useWebViewStore(state => state.ready);

  useEffect(() => {
    if (!webViewReady || !pendingPath) {
      return;
    }
    const path = pendingPath;
    pendingPath = null;
    openPath(path);
  }, [webViewReady]);

  useEffect(() => {
    const messaging = getMessaging();

    (async () => {
      try {
        await setUpNotificationChannels();
        await setUpIncomingCallCategory();
        const granted = await ensureNotificationPermission();
        if (!granted) {
          console.warn('[push] notification permission not granted');
        }
        // Recovers a ring that is already on screen — a full-screen intent
        // launch bypasses the press-action handlers entirely. Must run before
        // the app-open clear below, which would otherwise wipe the evidence.
        await restoreIncomingCallOnLaunch();
        // One-shot prompt; see the function doc for why this can't be a
        // real permission check.
        await ensureFullScreenIntentPermission();
      } catch (error) {
        console.error('[push] setup failed', error);
      } finally {
        clearNotifications();
      }
    })();

    const callEventUnsubscribe = registerCallPushForegroundHandlers();

    const messageUnsubscribe = onMessage(messaging, async remoteMessage => {
      // Call pushes are data-only and own their own ringing UI. onMessage only
      // fires in the foreground, where the overlay is already the ring screen —
      // a notification on top of it would be a second prompt for one call.
      if (await handleCallPushMessage(remoteMessage, { display: false })) {
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

    const openedUnsubscribe = onNotificationOpenedApp(
      messaging,
      remoteMessage => openPath(extractPath(remoteMessage.data)),
    );
    getInitialNotification(messaging).then(remoteMessage =>
      openPath(extractPath(remoteMessage?.data)),
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(async response => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data;
        if (await handleCallNotificationResponse(actionIdentifier, data)) {
          return;
        }
        openPath(extractPath(data));
      });

    const tokenRefreshUnsubscribe = onTokenRefresh(messaging, () =>
      registerFirebaseDeviceToken(),
    );

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        clearNotifications();
      }
    });

    return () => {
      callEventUnsubscribe();
      messageUnsubscribe();
      openedUnsubscribe();
      responseSubscription.remove();
      tokenRefreshUnsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return <></>;
}

export default FireBase;
