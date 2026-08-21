import { Alert, Platform } from 'react-native';

import { ActivityAction, startActivityAsync } from 'expo-intent-launcher';
import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import i18next from 'i18next';

import environmentNative from '@/environments/env';

import PlatformSecureStore from '../helpers/secureStore';

export const NOTIFICATION_CHANNELS = [
  { id: 'conversations', importance: AndroidImportance.HIGH },
  { id: 'reminders', importance: AndroidImportance.HIGH },
  { id: 'announcements', importance: AndroidImportance.DEFAULT },
] as const;

export async function setUpNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Promise.all(
    NOTIFICATION_CHANNELS.map(({ id, importance }) =>
      setNotificationChannelAsync(id, {
        name: i18next.t(`notification_channel.${id}`),
        importance,
      }),
    ),
  );
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  if (!current.canAskAgain) {
    return false;
  }
  return (await requestPermissionsAsync()).granted;
}

const FULL_SCREEN_INTENT_PROMPTED_KEY =
  'full_screen_intent_permission_prompted';
// Android only lets a full-screen intent draw over the lockscreen with a
// per-app grant starting in API 34 (Android 14); below that it just works.
const FULL_SCREEN_INTENT_MIN_SDK = 34;

/**
 * There is no JS-visible way to read whether the grant was actually given —
 * `NotificationManager.canUseFullScreenIntent()` is a native-only API that
 * neither expo-notifications nor react-native-notify-kit exposes. Without a
 * read, this can only ask once per install rather than re-check and nag on
 * every launch; a user who declines keeps the heads-up fallback ring.
 */
export async function ensureFullScreenIntentPermission(): Promise<void> {
  if (
    Platform.OS !== 'android' ||
    Number(Platform.Version) < FULL_SCREEN_INTENT_MIN_SDK
  ) {
    return;
  }

  const alreadyPrompted = await PlatformSecureStore.getItemAsync(
    FULL_SCREEN_INTENT_PROMPTED_KEY,
  );
  if (alreadyPrompted) {
    return;
  }
  await PlatformSecureStore.setItemAsync(FULL_SCREEN_INTENT_PROMPTED_KEY, '1');

  Alert.alert(
    i18next.t('push.full_screen_intent.title'),
    i18next.t('push.full_screen_intent.body'),
    [
      { text: i18next.t('push.full_screen_intent.later'), style: 'cancel' },
      {
        text: i18next.t('push.full_screen_intent.open_settings'),
        onPress: () => {
          startActivityAsync(ActivityAction.MANAGE_APP_USE_FULL_SCREEN_INTENT, {
            data: `package:${environmentNative.bundleId}`,
          }).catch(error =>
            console.warn(
              '[push] could not open full-screen-intent settings',
              error,
            ),
          );
        },
      },
    ],
  );
}
