import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ROUTES } from '@/components/router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Signika-Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
    'Signika Negative': require('../assets/fonts/SignikaNegative-VariableFont_wght.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="app" options={{ headerShown: false }} />
      {ROUTES.map((route) => (
        <Stack.Screen key={route.path} name={route.path} options={{ headerShown: false }} />
      ))}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
