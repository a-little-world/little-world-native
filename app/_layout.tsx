// app/_layout.tsx

import { CustomThemeProvider as NativeThemeProvider } from "@a-little-world/little-world-design-system-native";
import "@/src/i18n";
import { loadFonts } from "@/src/utils/loadFonts";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import environmentNative from "@/environments/env";
import LoadingScreenTokenValidator from "@/src/components/atoms/LoadingScreenTokenValidator";
import { DomCommunicationProvider } from "@/src/components/blocks/DomCommunicationCore";
import * as Sentry from "@sentry/react-native";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

if (environmentNative.sentryUrl) {
  Sentry.init({
    dsn: environmentNative.sentryUrl,
    sendDefaultPii: false,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration()],
  });
}

// // 1) Prevent auto hide *before* rendering anything.
// SplashScreen.preventAutoHideAsync().catch((e) => {
//   console.log("SPLASH ERROR", e);
// });

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [tokensValidated, setTokensValidated] = useState(false);

  useEffect(() => {
    loadFonts()
      .catch((e) => console.warn("Failed to load fonts:", e))
      .finally(() => setFontsLoaded(true));
  }, []);

  // 2) Hide only after the root view has laid out.
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      // await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const onTokensValidated = useCallback(async () => {
    setTokensValidated(true);
  }, [setTokensValidated]);

  return (
    <SafeAreaProvider>
      <View
        style={{ height: "100%", width: "100%" }}
        onLayout={onLayoutRootView}
      >
        <NativeThemeProvider>
          <DomCommunicationProvider>
            {!tokensValidated && (
              <LoadingScreenTokenValidator
                onTokensValidated={onTokensValidated}
              />
            )}
            {fontsLoaded && ( // start rendering as early as possible and overlay loading screen on top
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                }}
              />
            )}
          </DomCommunicationProvider>
        </NativeThemeProvider>
      </View>
    </SafeAreaProvider>
  );
});
