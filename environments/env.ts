import { EnvironmentNative } from './env.types';

const environmentNative: EnvironmentNative = {
  bundleId: 'com.littleworld.littleworldapp.dev',
  displayName: 'Little World (Dev)',
  googleCloudProjectNumber: '601387323189',
  googleServiceInfoFileIOS:
    './certs/google/GoogleService-Info-development.plist',
  googleServiceInfoFileAndroid:
    './certs/google/google-services-development.json',
  appleEnvironment: 'development',
  sentryProject: undefined,
  sentryUrl: undefined,
};

export default environmentNative;
