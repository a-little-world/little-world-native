// This is the native internal environment, the frontend environment is at `@/environment`
import { environment as frontendEnvironment } from "@/environment";
import Constants from "expo-constants";
import { Platform } from "react-native";

export const ENV_CONFIG = {
  USE_EXPO_GO: Constants.expoConfig?.extra?.useExpoGo ?? false,
  USE_LIVEKIT: Constants.expoConfig?.extra?.useLiveKit ?? true,
};

export function isWebBuild() {
  return Platform.OS === "web";
}

export interface EnvironmentNative {
  googleCloudProjectNumber: string;
  showDebugPanel: boolean;
  production: boolean;
}

export const environment: EnvironmentNative = {
  googleCloudProjectNumber: "601387323189",
  showDebugPanel: true,
  production: frontendEnvironment.production,
};

export const isExpoGoMode = () => ENV_CONFIG.USE_EXPO_GO;
export const isLiveKitEnabled = () => ENV_CONFIG.USE_LIVEKIT;

export const getDevelopmentModeInfo = () => {
  if (isExpoGoMode()) {
    return {
      mode: "Expo Go",
      features: ["Navigation", "UI Components", "Basic App Flow"],
      limitations: ["No LiveKit", "No Native Modules"],
      recommendation: "Use for UI/UX testing and navigation flow",
    };
  } else {
    return {
      mode: "Development Build",
      features: ["Full Native Modules", "LiveKit Integration", "All Features"],
      limitations: ["Requires EAS Build", "Slower Development Cycle"],
      recommendation: "Use for testing LiveKit and native features",
    };
  }
};
