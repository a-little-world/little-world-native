import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "little-world-app",
  slug: "little-world-app",
  version: "1.0.15",
  orientation: "portrait",
  icon: "./src/assets/images/icon.png",
  scheme: "little-world-app",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "little-world",
  ios: {
    buildNumber: "1.0.7.4",
    supportsTablet: true,
    backgroundColor: "#ffffff",
    bitcode: false,
    bundleIdentifier: "com.littleworld.littleworldapp",
    appleTeamId: "3Z662F5MW8",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "Allow camera usage to participate in group video calls",
      NSMicrophoneUsageDescription:
        "Allow microphone usage to participate in group calls",
    },
    entitlements: {
      "com.apple.developer.devicecheck.appattest-environment":
        process.env.APPLE_APPATTEST_ENVIRONMENT ?? "development",
    },
  },
  android: {
    package: "com.littleworld.littleworldapp",
    versionCode: 15,
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    permissions: [
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WAKE_LOCK",
      "android.permission.BLUETOOTH",
    ],
    allowBackup: true,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./src/assets/images/favicon.png",
  },
  splash: {
    image: "./src/assets/images/splash-icon.png",
    imageWidth: 200,
    resizeMode: "contain",
    backgroundColor: "#ffffff",
    tabletImage: "./assets/splash-tablet.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    [
      "expo-secure-store",
      {
        configureAndroidBackup: true,
        faceIDPermission:
          "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./src/assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    ...(process.env.EXPO_PUBLIC_USE_EXPO_GO !== "true"
      ? {
        eas: {
          projectId: "d114c1e1-3b95-463a-b8d4-c24ca29f1d05",
        },
      }
      : {}),
    useExpoGo: process.env.EXPO_PUBLIC_USE_EXPO_GO === "true",
    useLiveKit: process.env.EXPO_PUBLIC_USE_EXPO_GO !== "true",
  },
});
