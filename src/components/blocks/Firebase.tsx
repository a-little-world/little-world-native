import { useEffect } from 'react';
import { AppState } from 'react-native';

import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

import type { NotificationPayload } from '@/frontend/src';
import { domCommunicationStore } from '@/src/store/domCommunicationStore';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function toNotificationPayload({
  notification,
  data,
}: RemoteMessage): NotificationPayload {
  return {
    notification: notification && {
      title: notification.title,
      body: notification.body,
    },
    data: data as NotificationPayload['data'],
  };
}

async function handleNotificationClicked(remoteMessage: RemoteMessage | null) {
  if (!remoteMessage) {
    return;
  }

  domCommunicationStore
    .get()
    .sendToDom?.({
      action: 'NOTIFICATION_CLICKED',
      payload: toNotificationPayload(remoteMessage),
    })
    .catch(error => console.warn('NOTIFICATION_CLICKED failed', error));
}

async function clearNotifications() {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

function FireBase() {
  useEffect(() => {
    const messaging = getMessaging();

    const messageUnsubscribe = onMessage(messaging, async remoteMessage => {
      if (!remoteMessage.notification) {
        return;
      }
      domCommunicationStore
        .get()
        .sendToDom?.({
          action: 'NOTIFICATION_RECEIVED',
          payload: toNotificationPayload(remoteMessage),
        })
        .catch(error => console.warn('NOTIFICATION_RECEIVED failed', error));
    });

    const openedUnsubscribe = onNotificationOpenedApp(
      messaging,
      handleNotificationClicked,
    );
    getInitialNotification(messaging).then(handleNotificationClicked);

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
      tokenRefreshUnsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  return <></>;
}

export default FireBase;
