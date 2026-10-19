import { getMessaging } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { Platform } from 'expo-modules-core';

import { apiFetch } from '../api/helpers';
import { getDeviceId } from './device';
import { ensureNotificationPermission } from './notifications';

export async function registerFirebaseDeviceToken(): Promise<void> {
  if (!Device.isDevice || !(await ensureNotificationPermission())) {
    return;
  }

  try {
    await apiFetch('/api/push_notifications/register', {
      method: 'POST',
      body: {
        install_id: await getDeviceId(),
        token: await getMessaging().getToken(),
        platform: Platform.OS,
        model_name: Device.modelName,
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
