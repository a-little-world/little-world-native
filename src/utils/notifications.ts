import { Platform } from 'react-native';

import {
  AndroidImportance,
  AndroidNotificationVisibility,
  getPermissionsAsync,
  NotificationChannelInput,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import i18next from 'i18next';

export const NOTIFICATION_CHANNELS: Record<
  string,
  Omit<NotificationChannelInput, 'name'>
> = {
  conversations: {
    importance: AndroidImportance.HIGH,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  },
  reminders: {
    importance: AndroidImportance.HIGH,
  },
  announcements: {
    importance: AndroidImportance.DEFAULT,
  },
};

export async function setUpNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Promise.all(
    Object.entries(NOTIFICATION_CHANNELS).map(([id, channelInput]) =>
      setNotificationChannelAsync(id, {
        name: i18next.t(`notification_channel.${id}`),
        ...channelInput,
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
