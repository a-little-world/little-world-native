import { EnvironmentNative } from './env.types';

const environmentNative: EnvironmentNative = {
  bundleId: 'com.littleworld.littleworldapp.dev',
  scheme: 'littleworld-dev',
  displayName: 'Little World (Dev)',
  googleCloudProjectNumber: '601387323189',
  googleServiceInfoFileIOS:
    './certs/google/GoogleService-Info-development.plist',
  googleServiceInfoFileAndroid:
    './certs/google/google-services-development.json',
  appleEnvironment: 'development',
  // set in eas.json; locally opt in with EXPO_PUBLIC_SENTRY_ENABLED=true
  ...(process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true'
    ? {
        sentryProject: 'lw-development-native',
        sentryUrl:
          'https://4448ffc34284db3a044459b1ce4fcba8@o4506032071507968.ingest.us.sentry.io/4512380585115648',
      }
    : {}),
  integrityBypassToken: process.env.EXPO_PUBLIC_INTEGRITY_BYPASS_TOKEN,
};

export const SENTRY_ORG = 'a-little-world-gug';

export default environmentNative;
