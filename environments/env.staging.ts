import { EnvironmentNative } from './env.types';

const environmentNative: EnvironmentNative = {
  bundleId: 'com.littleworld.littleworldapp.beta',
  scheme: 'littleworld-beta',
  displayName: 'Little World (Beta)',
  googleCloudProjectNumber: '601387323189',
  googleServiceInfoFileIOS: './certs/google/GoogleService-Info-staging.plist',
  googleServiceInfoFileAndroid: './certs/google/google-services-staging.json',
  appleEnvironment: 'production',
  sentryProject: 'lw-staging-native',
  // LW-REPRO: sentry disabled
  sentryUrl: undefined,
};

export default environmentNative;
