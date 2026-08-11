import { Platform } from 'react-native';

import {
  AndroidImportance,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import i18next from 'i18next';

export const NOTIFICATION_CHANNELS = [
  { id: 'conversations', importance: AndroidImportance.HIGH },
  { id: 'random_calls', importance: AndroidImportance.HIGH },
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
