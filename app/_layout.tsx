// app/_layout.tsx

import { CustomThemeProvider as NativeThemeProvider } from "@a-little-world/little-world-design-system-native";
import { setJSExceptionHandler } from "react-native-exception-handler";

setJSExceptionHandler((e, isFatal) => {
  console.log("JS ERROR", { isFatal, message: e?.message, stack: e?.stack });
}, true);

import { loadStoredTokensIntoStore } from "@/src/api/token";
import "@/src/i18n";
import { loadFonts } from "@/src/utils/loadFonts";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoadingScreen from "@/src/components/atoms/LoadingScreen";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://5b7832a26c656c8d809e8a3b26f57756@o4506032071507968.ingest.us.sentry.io/4506633212067840',
  sendDefaultPii: false,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
});

// // 1) Prevent auto hide *before* rendering anything.
// SplashScreen.preventAutoHideAsync().catch((e) => {
//   console.log("SPLASH ERROR", e);
// });

export default Sentry.wrap(function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await loadFonts();
        await loadStoredTokensIntoStore();
      } catch (e) {
        console.warn("Failed to load fonts:", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 2) Hide only after the root view has laid out.
  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      // await SplashScreen.hideAsync();
    }
  }, [ready]);

  return (
    <SafeAreaProvider>
      <View
        style={{ height: "100%", width: "100%" }}
        onLayout={onLayoutRootView}
      >
        <NativeThemeProvider>
          {!ready ? (
            <LoadingScreen />
          ) : (
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            />
          )}
        </NativeThemeProvider>
      </View>
    </SafeAreaProvider>
  );
});