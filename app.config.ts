import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'little-world-app',
  slug: 'little-world-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: 'little-world-app',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    backgroundColor: '#ffffff',
    bitcode: false,
    bundleIdentifier: 'com.seanlittleworld.littleworldapp',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    permissions: [
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CAMERA',
      'android.permission.INTERNET',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WAKE_LOCK',
      'android.permission.BLUETOOTH'
    ]
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './src/assets/images/favicon.png'
  },
  plugins: [
    'expo-router',
    // Only include LiveKit plugins when not in Expo Go mode
    ...(process.env.EXPO_PUBLIC_USE_EXPO_GO !== 'true' ? [
      '@livekit/react-native-expo-plugin',
      '@config-plugins/react-native-webrtc'
    ] : []),
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: 'd114c1e1-3b95-463a-b8d4-c24ca29f1d05'
    },
    // Environment flags
    useExpoGo: process.env.EXPO_PUBLIC_USE_EXPO_GO === 'true',
    useLiveKit: process.env.EXPO_PUBLIC_USE_EXPO_GO !== 'true'
  }
}); 