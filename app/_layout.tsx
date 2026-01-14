// app/_layout.tsx

import { CustomThemeProvider as NativeThemeProvider } from "@a-little-world/little-world-design-system-native";
import { setJSExceptionHandler } from "react-native-exception-handler";

setJSExceptionHandler((e, isFatal) => {
  console.log("JS ERROR", { isFatal, message: e?.message, stack: e?.stack });
}, true);

import "@/src/i18n";
import { loadFonts } from "@/src/utils/loadFonts";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import environmentNative from "@/environments/env";
import { loadStoredTokensIntoStore } from "@/src/api/helpers";
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
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [tokensValidated, setTokensValidated] = useState(false);

  useEffect(() => {
    loadStoredTokensIntoStore()
      .catch((e) => console.warn("Failed to load tokens into store", e))
      .finally(() => setTokensLoaded(true));

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
            {/* {!tokensValidated && (
            <View
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: 999,
              }}
            >
              <LoadingScreenTokenValidator
                onTokensValidated={onTokensValidated}
              />
            </View>
          )} */}
            {!tokensValidated && (
              <LoadingScreenTokenValidator
                onTokensValidated={onTokensValidated}
                tokensLoaded={tokensLoaded}
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
