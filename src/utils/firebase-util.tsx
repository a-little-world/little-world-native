import { getMessaging } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { Platform } from 'expo-modules-core';
import { getPermissionsAsync } from 'expo-notifications';

import { apiFetch } from '../api/helpers';
import { getDeviceId } from './device';
import { ensureNotificationPermission } from './notifications';

// registers without push permission too, never prompts
export async function registerInstallation(): Promise<void> {
  try {
    const pushAllowed =
      Device.isDevice && (await getPermissionsAsync()).granted;
    await apiFetch('/api/installations/register', {
      method: 'POST',
      body: {
        install_id: await getDeviceId(),
        platform: Platform.OS,
        model_name: Device.modelName,
        token: pushAllowed
          ? await getMessaging()
              .getToken()
              .catch(() => undefined)
          : undefined,
      },
    });
  } catch {
    // ignore
  }
}

export async function registerFirebaseDeviceToken(): Promise<void> {
  if (Device.isDevice) {
    await ensureNotificationPermission();
  }
  await registerInstallation();
}

export async function unregisterFirebaseDeviceToken(): Promise<void> {
  await apiFetch('/api/push_notifications/unregister', {
    method: 'POST',
    body: { install_id: await getDeviceId() },
  });
}
