import { EnvironmentNative } from "./env.types";

const environmentNative: EnvironmentNative = {
  bundleId: "com.littleworld.littleworldapp",
  displayName: "Little World",
  urlScheme: "little-world-app",
  googleCloudProjectNumber: "601387323189",
  googleServiceInfoFileIOS:
    "./certs/google/GoogleService-Info-production.plist",
  googleServiceInfoFileAndroid:
    "./certs/google/google-services-production.json",
  appleEnvironment: "production",
  sentryProject: "lw-prod-native",
  sentryUrl:
    "https://471ed1aed9372af87fa86d3eb7ee95c7@o4506032071507968.ingest.us.sentry.io/4511607774117888",
};

export default environmentNative;
