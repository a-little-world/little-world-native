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
import { useWebViewStore } from '@/src/store/webViewStore';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';
import {
  channelIdForType,
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

function openPath(path: string | null) {
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
        const granted = await ensureNotificationPermission();
        if (!granted) {
          console.warn('[push] notification permission not granted');
        }
      } catch (error) {
        console.error('[push] setup failed', error);
      }
    })();

    // Notifications stay silent when app is in foreground -> display it manually
    // TODO: maybe replace with toast?
    const messageUnsubscribe = onMessage(messaging, async remoteMessage => {
      if (!remoteMessage.notification) {
        return;
      }
      const channelId = channelIdForType(
        remoteMessage.notification.android?.channelId,
      );
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            data: remoteMessage.data ?? {},
          },
          trigger: channelId ? { channelId } : null,
        });
      } catch (error) {
        console.warn('[push] could not show notification', error);
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
        openPath(extractPath(response.notification.request.content.data)),
      );

    const tokenRefreshUnsubscribe = onTokenRefresh(messaging, () =>
      registerFirebaseDeviceToken(),
    );

    // clear notificaitons upon app open
    clearNotifications();
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        clearNotifications();
      }
    });

    return () => {
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
