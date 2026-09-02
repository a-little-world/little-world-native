import { ConfigContext, ExpoConfig } from 'expo/config';

import 'tsx';

// Enable import of TypeScript files
import environmentNative from './environments/env';

const APP_VERSION = '1.1.0'; // x-release-please-version
const [APP_MAJOR, APP_MINOR, APP_PATCH] = APP_VERSION.split('.').map(Number);

// The build number (CFBundleVersion / versionCode) is just a monotonic "which upload" counter.
// Staging/beta dispatches inject a unique EAS_BUILD_NUMBER (the CI run number) at build time so
// repeated betas at the same marketing version don't collide in TestFlight / Play. Unset for
// prod/dev builds, which derive it from the semver (prod ships each version once).
const IOS_BUILD_NUMBER = process.env.EAS_BUILD_NUMBER || APP_VERSION;
const ANDROID_VERSION_CODE = process.env.EAS_BUILD_NUMBER
  ? Number(process.env.EAS_BUILD_NUMBER)
  : APP_MAJOR * 10000 + APP_MINOR * 100 + APP_PATCH;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: environmentNative.displayName,
  slug: 'little-world-app',
  version: APP_VERSION,
  orientation: 'default',
  icon: './src/assets/images/logo-image.png',
  userInterfaceStyle: 'automatic',
  owner: 'little-world',
  ios: {
    buildNumber: IOS_BUILD_NUMBER,
    supportsTablet: true,
    backgroundColor: '#ffffff',
    bitcode: false,
    bundleIdentifier: environmentNative.bundleId,
    appleTeamId: '3Z662F5MW8',
    googleServicesFile: environmentNative.googleServiceInfoFileIOS,
    icon: './assets/images/icons/app.icon',
    splash: {
      image: './src/assets/images/splash-icon.png',
      imageWidth: 200,
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
      tabletImage: './src/assets/images/splash-icon.png',
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        'Allow camera usage to participate in group video calls',
      NSMicrophoneUsageDescription:
        'Allow microphone usage to participate in group calls',
      UIBackgroundModes: ['remote-notification', 'fetch'],
    },
    entitlements: {
      'aps-environment': environmentNative.appleEnvironment,
      'com.apple.developer.devicecheck.appattest-environment':
        environmentNative.appleEnvironment,
    },
  },
  android: {
    package: environmentNative.bundleId,
    versionCode: ANDROID_VERSION_CODE,
    googleServicesFile: environmentNative.googleServiceInfoFileAndroid,
    icon: './assets/images/icons/Android_Icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/images/icons/Android_Icon_Foreground.png',
      monochromeImage: './assets/images/icons/Android_Icon_Monochrome.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CAMERA',
      'android.permission.INTERNET',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WAKE_LOCK',
      'android.permission.BLUETOOTH',
    ],
    allowBackup: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './src/assets/images/favicon.png',
  },
  splash: {
    image: './src/assets/images/splash-icon.png',
    imageWidth: 200,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
    tabletImage: './src/assets/images/logo-image.png',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
        },
      },
    ],
    'expo-router',
    'expo-font',
    'expo-web-browser',
    [
      'expo-secure-store',
      {
        configureAndroidBackup: true,
        faceIDPermission:
          'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icons/Android_Notification_Icon.png',
      },
    ],
    ...(environmentNative.sentryProject
      ? [
          [
            '@sentry/react-native/expo',
            {
              project: environmentNative.sentryProject,
              organization: 'a-little-world-gug',
            },
          ] satisfies NonNullable<ExpoConfig['plugins']>[number],
        ]
      : []),
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    ...(process.env.EXPO_PUBLIC_USE_EXPO_GO !== 'true'
      ? {
          eas: {
            projectId: 'd114c1e1-3b95-463a-b8d4-c24ca29f1d05',
            //projectId: "93610aa8-629e-4031-ac3c-f622399cca78", @tbscode project id
          },
        }
      : {}),
    useExpoGo: process.env.EXPO_PUBLIC_USE_EXPO_GO === 'true',
    useLiveKit: process.env.EXPO_PUBLIC_USE_EXPO_GO !== 'true',
  },
});
