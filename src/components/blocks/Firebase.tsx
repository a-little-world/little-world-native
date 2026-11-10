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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// store path from notification in case webview is not ready yet
let pendingPath: string | null = null;

function extractPath(data?: Record<string, unknown>): string | null {
  const path = data?.path;
  return typeof path === 'string' && path.startsWith('/') ? path : null;
}

async function openPath(path: string | null) {
  if (!path) {
    return;
  }

  domCommunicationStore
    .get()
    .sendToDom?.({
      action: 'NAVIGATE',
      payload: { path },
    })
    .catch(error => console.warn('NAVIGATE from notification failed', error));
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

    const messageUnsubscribe = onMessage(messaging, async remoteMessage => {
      if (!remoteMessage.notification) {
        return;
      }
      domCommunicationStore
        .get()
        .sendToDom?.({
          action: 'DISPLAY_NOTIFICATION',
          payload: {
            title: remoteMessage.notification.title ?? undefined,
            body: remoteMessage.notification.body ?? undefined,
            path: extractPath(remoteMessage.data) ?? undefined,
          },
        })
        .catch(error => console.warn('DISPLAY_NOTIFICATION failed', error));
    });

    const openedUnsubscribe = onNotificationOpenedApp(
      messaging,
      remoteMessage => openPath(extractPath(remoteMessage.data)),
    );
    getInitialNotification(messaging).then(remoteMessage =>
      openPath(extractPath(remoteMessage?.data)),
    );

    const tokenRefreshUnsubscribe = onTokenRefresh(messaging, () =>
      registerFirebaseDeviceToken().catch(() => {}),
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
      tokenRefreshUnsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return <></>;
}

export default FireBase;
