import Constants from 'expo-constants';

export const ENV_CONFIG = {
  USE_EXPO_GO: Constants.expoConfig?.extra?.useExpoGo ?? false,
  USE_LIVEKIT: Constants.expoConfig?.extra?.useLiveKit ?? true,
};

export interface Environment {
  ecryptedNativeSecret: string,
  developmentOnlyOuterLayerDecryptionKey: string,
  localInnerLayerDecryptionKey: string
  production: boolean
}

export const environment: Environment = {
  ecryptedNativeSecret: "LVObrvZAgT/BcObWoRnc5RdYQ/mF3os9:1bfORapXAmhRG2ONi+BHNc8AE6ThyabiV+dCIdBMXSnvx3OBThmgNLWlom0DTfjDlGo7fwn/YbiIwvCgQ+reVngpti/kPjU/yd65yiKdr5AwrQbwk36hngaBPNR32T6sp6gSUDX1/hPK",
  developmentOnlyOuterLayerDecryptionKey: "kEzw1Rd5axcHUj9Mg0UhZv1PRuHAPV0OkKDSiS9h6uU=",
  localInnerLayerDecryptionKey: "T/MWGCeO/XlhKTbp/wullhh2yG4XMMOpHWH3NQMNBXQ=",
  production: false
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