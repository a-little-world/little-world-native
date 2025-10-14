import * as AppIntegrity from '@expo/app-integrity';
import { environment as frontendEnvironment } from '@/environment';
import { environment } from '../config/environment';
import * as SecureStore from './secureStore';
import { Platform } from 'react-native';

export function supportsAppIntegrity(): boolean {
  return AppIntegrity.isSupported && !(Platform.OS === 'web');
}

export function secureStoreIsAvailable(): boolean {
  return !(Platform.OS === 'web');
}
export function getBackendUrl(): string {
  return frontendEnvironment.backendUrl;
}