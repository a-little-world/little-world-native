export interface EnvironmentNative {
  bundleId: string;
  scheme: string;
  displayName: string;
  googleCloudProjectNumber: string;
  googleServiceInfoFileIOS: string;
  googleServiceInfoFileAndroid: string;
  appleEnvironment: 'development' | 'production';
  sentryProject?: string;
  sentryUrl?: string;
}
