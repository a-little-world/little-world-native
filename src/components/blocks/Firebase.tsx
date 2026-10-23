import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '@/src/store/authStore';
import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';
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
  const accessToken = useAuthStore(state => state.accessToken);
  const [shouldRegisterToken, setShouldRegisterToken] = useState(false);
  const registeringRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !shouldRegisterToken || registeringRef.current) {
      return;
    }
    registeringRef.current = true;
    registerFirebaseDeviceToken().finally(() => {
      registeringRef.current = false;
      setShouldRegisterToken(false);
    });
  }, [accessToken, shouldRegisterToken, setShouldRegisterToken]);

  useEffect(() => {
    const messaging = getMessaging();

    (async () => {
      try {
        await setUpNotificationChannels();
        const granted = await ensureNotificationPermission();
        if (!granted) {
          console.warn('[push] notification permission not granted');
          return;
        }
        setShouldRegisterToken(true);
      } catch (error) {
        console.error('[push] setup failed', error);
      }
    })();

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

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(response =>
        openPath(extractPath(response.notification.request.content.data)),
      );

    const tokenRefreshUnsubscribe = onTokenRefresh(messaging, () =>
      setShouldRegisterToken(true),
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
