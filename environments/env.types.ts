export interface EnvironmentNative {
  bundleId: string;
  displayName: string;
  urlScheme: string;
  googleCloudProjectNumber: string;
  googleServiceInfoFileIOS: string;
  googleServiceInfoFileAndroid: string;
  appleEnvironment: "development" | "production";
  sentryProject?: string;
  sentryUrl?: string;
}
