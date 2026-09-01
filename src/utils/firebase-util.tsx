import { PermissionsAndroid } from 'react-native';

import {
  AuthorizationStatus,
  getMessaging,
} from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import { PermissionStatus, Platform } from 'expo-modules-core';

import { apiFetch } from '../api/helpers';
import { getDeviceId } from './device';

async function requestPermissionIOS(): Promise<boolean> {
  let permission = await getMessaging().hasPermission();

  if (permission === AuthorizationStatus.NOT_DETERMINED) {
    permission = await getMessaging().requestPermission();
  }

  const allowedStatuses: (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus][] =
    [AuthorizationStatus.AUTHORIZED, AuthorizationStatus.PROVISIONAL];

  return allowedStatuses.includes(permission);
}

async function requestPermissionAndroid(): Promise<boolean> {
  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  if (hasPermission) {
    return true;
  }

  const permissionStatus = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  return permissionStatus === PermissionStatus.GRANTED;
}

async function requestUserPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  if (Platform.OS === 'android') {
    return requestPermissionAndroid();
  } else if (Platform.OS === 'ios') {
    return requestPermissionIOS();
  } else {
    return false;
  }
}

export async function registerFirebaseDeviceToken(): Promise<void> {
  const permission = await requestUserPermission();
  if (!permission) {
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
  } catch (_e) {
    // ignore
  }
}

export async function unregisterFirebaseDeviceToken(): Promise<void> {
  await apiFetch('/api/push_notifications/unregister', {
    method: 'POST',
    body: { install_id: await getDeviceId() },
  });
}
