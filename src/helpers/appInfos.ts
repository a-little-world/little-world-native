import { Platform } from 'react-native';

import * as AppIntegrity from '@expo/app-integrity';

export function supportsAppIntegrity(): boolean {
  return AppIntegrity.isSupported && !(Platform.OS === 'web');
}

export function secureStoreIsAvailable(): boolean {
  return !(Platform.OS === 'web');
}
