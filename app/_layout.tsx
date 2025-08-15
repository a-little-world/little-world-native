import "@/src/i18n";
import { ROUTES } from "@/src/routes";
import { loadFonts } from "@/src/utils/loadFonts";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const prepare = async (): Promise<void> => {
      try {
        await loadFonts();
        setFontsLoaded(true);
        console.log("Fonts loaded successfully");
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

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        {ROUTES.map((route) => (
          <Stack.Screen key={route.path} name={route.name} />
        ))}
        <Stack.Screen name="+not-found" />
      </Stack>
      <PortalHost />
    </SafeAreaProvider>
  );
}
