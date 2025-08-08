import "@/src/i18n";
import { ROUTES } from "@/src/routes";
import { loadFonts } from "@/src/utils/loadFonts";
import { suppressWarnings } from "@/src/utils/suppressWarnings";
import { CustomThemeProvider } from "@a-little-world/little-world-design-system-native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

suppressWarnings();

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
      <CustomThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {ROUTES.map((route) => (
            <Stack.Screen key={route.path} name={route.name} />
          ))}
        </Stack>
        <PortalHost />
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
