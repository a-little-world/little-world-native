import { getMessaging } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';

import { apiFetch } from '../api/helpers';
import { getDeviceId } from './device';
import {
  ensureNotificationPermission,
  setUpNotificationChannels,
} from './notifications';

export async function registerFirebaseDeviceToken(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  try {
    await setUpNotificationChannels();
    if (!(await ensureNotificationPermission())) {
      return;
    }
    await apiFetch('/api/push_notifications/register', {
      method: 'POST',
      body: {
        install_id: await getDeviceId(),
        token: await getMessaging().getToken(),
      },
    });
  } catch {
    // ignore
  }
}

export async function unregisterFirebaseDeviceToken(): Promise<void> {
  await apiFetch('/api/push_notifications/unregister', {
    method: 'POST',
    body: { install_id: await getDeviceId() },
  });
}
