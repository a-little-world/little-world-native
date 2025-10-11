import * as AppIntegrity from '@expo/app-integrity';
import { environment as frontendEnvironment } from '@/environment';
import * as SecureStore from './secureStore';
import { Platform } from 'react-native';

export function supportsAppIntegrity(): boolean {
  return AppIntegrity.isSupported;
}

export function secureStoreIsAvailable(): boolean {
  return !(Platform.OS === 'web');
}

export async function secureStoreContainsDecryptionKey(): Promise<string> {
  const keyExists = (await SecureStore.getItemAsync('native_secret_outer_layer_decryption_key')) !== null;
  const keyLength = keyExists ? (await SecureStore.getItemAsync('native_secret_outer_layer_decryption_key'))?.length : 0;
  const messageString = keyExists ? `YES, key length: ${keyLength}` : 'NO, key not found';
  return messageString;
}

export function getBackendUrl(): string {
  return frontendEnvironment.backendUrl;
}