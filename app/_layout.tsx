import React from "react";
import { ROUTES } from "@/src/routes";
import { CustomThemeProvider } from "@a-little-world/little-world-design-system-native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { loadFonts } from "@/src/utils/loadFonts";
import '@/src/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const prepare = async (): Promise<void> => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Failed to load fonts:", e);
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // The Stack component is what Expo Router uses to handle navigation
  // It will automatically render the current route's content
  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="app" />
          {ROUTES.map((route) => (
            <Stack.Screen key={route.path} name={route.path} />
          ))}
          <Stack.Screen name="+not-found" />
          <PortalHost />
        </Stack>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
