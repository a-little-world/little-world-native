import "@/src/i18n";
import { ROUTES } from "@/src/routes";
import { useFonts } from "expo-font";
import { loadFonts } from "@/src/utils/loadFonts";
import { CustomThemeProvider } from "@a-little-world/little-world-design-system-native";
import { PortalHost } from "@rn-primitives/portal";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // const [loaded] = useFonts({
  //   SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  //   'Signika-Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
  //   'Signika Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
  // });

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

  // The Stack component is what Expo Router uses to handle navigation
  // It will automatically render the current route's content
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
        }}
      >
        {ROUTES.map((route) => (
          <Stack.Screen key={route.path} name={route.name} />
        ))}
        <Stack.Screen name="+not-found" />
      </Stack>
    </SafeAreaProvider>
  );
}
