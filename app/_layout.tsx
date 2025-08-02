import "@/src/i18n";
import { ROUTES } from "@/src/routes";
import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import styled, { ThemeContext, StyleSheetManager } from 'styled-components';

console.log('styled-components context:', ThemeContext);
console.log('styled-components manager:', StyleSheetManager?.toString?.());

export const unstable_settings = {
  initialRouteName: 'index',
  ssr: false,
};

export default function RootLayout() {
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Signika-Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
    'Signika Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
  });
  
  // The Stack component is what Expo Router uses to handle navigation
  // It will automatically render the current route's content
  if (!mounted) return null;

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
