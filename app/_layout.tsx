// app/_layout.tsx

import { setJSExceptionHandler } from "react-native-exception-handler";
import {
  CustomThemeProvider as NativeThemeProvider,
} from "@a-little-world/little-world-design-system-native";


setJSExceptionHandler((e, isFatal) => {
  console.log("JS ERROR", { isFatal, message: e?.message, stack: e?.stack });
}, true);

import "react-native-reanimated";
import "@/src/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadFonts } from "@/src/utils/loadFonts";

// 1) Prevent auto hide *before* rendering anything.
SplashScreen.preventAutoHideAsync().catch((e) => {
  console.log("SPLASH ERROR", e);
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await loadFonts();
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
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    // Keep returning null while preparing; splash stays up.
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* 3) Let expo-router register screens automatically. */}
        <NativeThemeProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { 
              // backgroundColor: "#fff",
              flex: 1,
            },
            gestureEnabled: true,
              fullScreenGestureEnabled: true,
            }}
          />
        </NativeThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}