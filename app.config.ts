import { ConfigContext, ExpoConfig } from "expo/config";
import "tsx"; // Enable import of TypeScript files
import environmentNative from "./environments/env";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "little-world-app",
  slug: "little-world-app",
  version: "1.0.20",
  orientation: "portrait",
  icon: "./src/assets/images/logo-image.png",
  scheme: "little-world-app",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  owner: "little-world",
  ios: {
    buildNumber: "1.0.20.1",
    supportsTablet: true,
    backgroundColor: "#ffffff",
    bitcode: false,
    bundleIdentifier: "com.littleworld.littleworldapp",
    appleTeamId: "3Z662F5MW8",
    googleServicesFile: environmentNative.googleServiceInfoFileIOS,
    icon: "./assets/images/icons/app.icon",
    splash: {
      image: "./src/assets/images/splash-icon.png",
      imageWidth: 200,
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      tabletImage: "./src/assets/images/splash-icon.png",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        "Allow camera usage to participate in group video calls",
      NSMicrophoneUsageDescription:
        "Allow microphone usage to participate in group calls",
      UIBackgroundModes: ["remote-notification", "fetch"],
    },
    entitlements: {
      "aps-environment": environmentNative.appleEnvironment,
      "com.apple.developer.devicecheck.appattest-environment":
        environmentNative.appleEnvironment,
    },
  },
  android: {
    package: "com.littleworld.littleworldapp",
    versionCode: 20,
    googleServicesFile: environmentNative.googleServiceInfoFileAndroid,
    adaptiveIcon: {
      foregroundImage: "./src/assets/images/logo-image.png",
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
    tabletImage: "./src/assets/images/logo-image.png",
  },
  notification: {
    icon: "./src/assets/images/logo-image.png",
    color: "#ffffff",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
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
    [
      "expo-notifications",
      {
        icon: "./src/assets/images/splash-icon.png",
        color: "#ffffff",
        defaultChannel: "default",
        enableBackgroundRemoteNotifications: true,
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "lw-prod-backend",
        organization: "a-little-world-gug",
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
            //projectId: "93610aa8-629e-4031-ac3c-f622399cca78", @tbscode project id
          },
        }
      : {}),
    useExpoGo: process.env.EXPO_PUBLIC_USE_EXPO_GO === "true",
    useLiveKit: process.env.EXPO_PUBLIC_USE_EXPO_GO !== "true",
  },
});
