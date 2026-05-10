export interface EnvironmentNative {
  googleCloudProjectNumber: string;
  googleServiceInfoFileIOS: string;
  googleServiceInfoFileAndroid: string;
  appleEnvironment: "development" | "production";
  sentryUrl?: string;
}
