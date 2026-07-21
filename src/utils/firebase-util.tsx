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

async function updateFirebaseDeviceRegistration(
  step: 'register' | 'unregister',
): Promise<void> {
  const permission = await requestUserPermission();
  if (!permission) {
    return;
  }

  const deviceId = await getDeviceId();
  const token = await getMessaging().getToken();
  const platform = Platform.OS;
  const modelName = Device.modelName;

  await apiFetch(`/api/push_notifications/${step}`, {
    method: 'POST',
    body: {
      install_id: deviceId,
      token,
      platform,
      model_name: modelName,
    },
  });
}

export async function registerFirebaseDeviceToken(): Promise<void> {
  await updateFirebaseDeviceRegistration('register');
}

export async function unregisterFirebaseDeviceToken(): Promise<void> {
  await updateFirebaseDeviceRegistration('unregister');
}
