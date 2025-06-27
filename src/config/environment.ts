import Constants from 'expo-constants';

// Environment configuration
export const ENV_CONFIG = {
  // Set to true to use Expo Go mode (no LiveKit)
  // Set to false to use development build mode (with LiveKit)
  USE_EXPO_GO: Constants.expoConfig?.extra?.useExpoGo ?? false,
  USE_LIVEKIT: Constants.expoConfig?.extra?.useLiveKit ?? true,
};

// Helper functions
export const isExpoGoMode = () => ENV_CONFIG.USE_EXPO_GO;
export const isLiveKitEnabled = () => ENV_CONFIG.USE_LIVEKIT;

// Development mode info
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