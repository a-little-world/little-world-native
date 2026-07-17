// app/_layout.tsx

import "@/src/i18n";
import { loadFonts } from "@/src/utils/loadFonts";
import { CustomThemeProvider as NativeThemeProvider } from "@a-little-world/little-world-design-system-native";
import { Stack } from "expo-router";
// import * as SplashScreen from "expo-splash-screen";
import environmentNative from "@/environments/env";
import DebugPanel from "@/src/components/blocks/DebugPanel";
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

  return (
    <SafeAreaProvider>
      <View
        style={{ height: "100%", width: "100%" }}
        onLayout={onLayoutRootView}
      >
        <NativeThemeProvider>
          <DomCommunicationProvider>
            <DebugPanel />
            {fontsLoaded && ( // start rendering as early as possible
              <Stack
                screenOptions={{
                  headerShown: false,
                  // Back navigation gestures are handled inside the WebView
                  // -> disable here so they are not consumed prematurely
                  gestureEnabled: false,
                }}
              />
            )}
          </DomCommunicationProvider>
        </NativeThemeProvider>
      </View>
    </SafeAreaProvider>
  );
});
