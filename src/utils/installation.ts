import * as Device from 'expo-device';
import { Platform } from 'expo-modules-core';

import { apiFetch } from '../api/helpers';
import { getDeviceId } from './device';

export async function registerInstallation(): Promise<void> {
  await apiFetch('/api/installations/register', {
    method: 'POST',
    body: {
      install_id: await getDeviceId(),
      platform: Platform.OS,
      model_name: Device.modelName,
    },
  });
}
