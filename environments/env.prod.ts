import { EnvironmentNative } from './env.types';

const environmentNative: EnvironmentNative = {
  bundleId: 'com.littleworld.littleworldapp',
  scheme: 'littleworld',
  displayName: 'Little World',
  googleCloudProjectNumber: '601387323189',
  googleServiceInfoFileIOS:
    './certs/google/GoogleService-Info-production.plist',
  googleServiceInfoFileAndroid:
    './certs/google/google-services-production.json',
  appleEnvironment: 'production',
  sentryProject: 'lw-prod-native',
  // LW-REPRO: sentry disabled
  sentryUrl: undefined,
};

export default environmentNative;
