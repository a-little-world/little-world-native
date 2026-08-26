// app/_layout.tsx
// import * as SplashScreen from "expo-splash-screen";
import environmentNative from '@/environments/env';
import DebugPanel from '@/src/components/blocks/DebugPanel';
import { DomCommunicationProvider } from '@/src/components/blocks/DomCommunicationCore';
import IncomingCallOverlay from '@/src/components/blocks/IncomingCallOverlay';

import '@/src/i18n';

import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { CustomThemeProvider as NativeThemeProvider } from '@a-little-world/little-world-design-system-native';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';

import { isKeyguardLocked } from '@/modules/lock-screen';
import { incomingCallStore } from '@/src/store/incomingCallStore';
import {
  endLockScreenSession,
  getDisplayedIncomingCall,
} from '@/src/utils/incomingCall';
import {
  acceptIncomingCall,
  rejectIncomingCall,
} from '@/src/utils/incomingCallActions';
import { loadFonts } from '@/src/utils/loadFonts';

import 'react-native-reanimated';

import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      .catch(e => console.warn('Failed to load fonts:', e))
      .finally(() => setFontsLoaded(true));
  }, []);

  // MainActivity declares showWhenLocked so a cold full-screen-intent launch can
  // draw over the keyguard before any JS runs. Lower it again unless a call is
  // actually ringing, or the app bypasses the lock screen for good. Belongs here
  // rather than in <FireBase/>, which mounts behind the font gate.
  useEffect(() => {
    getDisplayedIncomingCall().then(call => {
      if (!call) {
        endLockScreenSession();
      }
    });
  }, []);

  // The restriction only exists because the device is locked, so drop it the
  // moment it isn't. Without this a user who leaves the app, unlocks properly and
  // comes back would stay locked out until the call ends. Skipped while a call is
  // ringing, which owns the flag.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (
        state === 'active' &&
        !isKeyguardLocked() &&
        !incomingCallStore.get().call
      ) {
        endLockScreenSession();
      }
    });
    return () => subscription.remove();
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
        style={{ height: '100%', width: '100%' }}
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
            {/* Mounted outside the font gate so an incoming call can paint
                immediately on a cold launch from the lock screen. */}
            <IncomingCallOverlay
              onAccept={acceptIncomingCall}
              onDecline={rejectIncomingCall}
            />
          </DomCommunicationProvider>
        </NativeThemeProvider>
      </View>
    </SafeAreaProvider>
  );
});
