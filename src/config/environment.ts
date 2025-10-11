// This is the native internal environment, the frontend environment is at `@/environment`
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { environment as frontendEnvironment } from '@/environment';

export const ENV_CONFIG = {
  USE_EXPO_GO: Constants.expoConfig?.extra?.useExpoGo ?? false,
  USE_LIVEKIT: Constants.expoConfig?.extra?.useLiveKit ?? true,
};

export function isWebBuild() {
  return Platform.OS === 'web';
}

export interface Environment {
  ecryptedNativeSecret: string,
  developmentOnlyOuterLayerDecryptionKey: string,
  localInnerLayerDecryptionKey: string,
  googleCloudProjectNumber: string,
  showDebugPanel: boolean,
  production: boolean,
}

export const environment: Environment = {
  ecryptedNativeSecret: "Zn1YJte+GwpzIbRaAhg+R6LSb04WV9E2ciFjdyFeukWVKYNl",
  developmentOnlyOuterLayerDecryptionKey: "Zn1YJte+GwpzIbRaHVEOEk8q6SD2W+YRO2PKm1sL4vs=",
  localInnerLayerDecryptionKey: "QYEOWLg8aZIxGLAuw12U8wa5ppEo/9DgEluX9MPICPE=",
  googleCloudProjectNumber: "106218836766",
  showDebugPanel: true,
  production: frontendEnvironment.production,
}

export const isExpoGoMode = () => ENV_CONFIG.USE_EXPO_GO;
export const isLiveKitEnabled = () => ENV_CONFIG.USE_LIVEKIT;

export const getDevelopmentModeInfo = () => {
  if (isExpoGoMode()) {
    return {
      mode: 'Expo Go',
      features: ['Navigation', 'UI Components', 'Basic App Flow'],
      limitations: ['No LiveKit', 'No Native Modules'],
      recommendation: 'Use for UI/UX testing and navigation flow'
    };
  } else {
    return {
      mode: 'Development Build',
      features: ['Full Native Modules', 'LiveKit Integration', 'All Features'],
      limitations: ['Requires EAS Build', 'Slower Development Cycle'],
      recommendation: 'Use for testing LiveKit and native features'
    };
  }
}; 