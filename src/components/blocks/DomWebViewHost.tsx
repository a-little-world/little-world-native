import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiFetch,
  ApiFetchOptions,
  refreshAccessTokens,
  updateTokens,
} from '@/src/api/helpers';
import { useAuthStore } from '@/src/store/authStore';
import { useWebViewStore } from '@/src/store/webViewStore';
import { getDeviceId } from '@/src/utils/device';

import {
  setForegroundTimeout,
  useDomCommunicationContext,
} from './DomCommunicationCore';
import LittleWorldWebLazy, { LittleWorldDomRef } from './LittleWorldWebLazy';

const READY_TIMEOUT = 20000;

export default function DomWebViewHost() {
  const { domRef, sendToReactNative, sendToDom } = useDomCommunicationContext();
  const insets = useSafeAreaInsets();

  // expo only creates the ref proxy while ref.current is null; a shared ref would keep
  // pointing at an unmounted webview after a remount
  const webViewRef = useRef<LittleWorldDomRef | null>(null);
  useLayoutEffect(() => {
    domRef.current = webViewRef.current;
    return () => {
      domRef.current = null;
    };
  }, [domRef]);

  // measured from mount: native token refresh before mount must not count
  const pageLoadedRef = useRef(false);
  useEffect(() => {
    if (useWebViewStore.getState().ready) return;
    const cancel = setForegroundTimeout(() => {
      const message = `WebView not ready after ${READY_TIMEOUT / 1000}s`;
      console.warn(message);
      Sentry.captureMessage(message, {
        level: 'warning',
        tags: { pageLoaded: pageLoadedRef.current },
      });
    }, READY_TIMEOUT);
    const unsubscribe = useWebViewStore.subscribe(({ ready }) => {
      if (ready) cancel();
    });
    return () => {
      cancel();
      unsubscribe();
    };
  }, []);

  // Frozen at mount: native already loaded stored tokens before this renders, so this
  // is the startup auth guess. Freezing avoids a later logout retroactively changing it.
  const [hasStoredToken] = useState(() => {
    const s = useAuthStore.getState();
    return !!(s.accessToken || s.refreshToken);
  });

  // Android hardware/gesture back → forward into the WebView's history.
  // iOS is handled at the WebView layer (allowsBackForwardNavigationGestures).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      // sendToDom would wait for the webview, back press must not
      if (!useWebViewStore.getState().ready) return false;
      // Consume the event synchronously so react-navigation doesn't exit the
      // app, then decide asynchronously whether the WebView actually went back.
      sendToDom({ action: 'NAVIGATE_BACK', payload: {} })
        .then(res => {
          if (!res?.ok || !(res.data as { handled?: boolean })?.handled) {
            BackHandler.exitApp();
          }
        })
        .catch(() => BackHandler.exitApp());
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBack,
    );
    return () => subscription.remove();
  }, [sendToDom]);

  const fetcher = (endpoint: string, options: ApiFetchOptions = {}) =>
    apiFetch(endpoint, options, 'frontend');

  const getAccessToken = async () => useAuthStore.getState().accessToken;

  const setAccessTokens = async (
    accessToken: string | undefined | null,
    refreshToken: string | undefined | null,
  ): Promise<void> => updateTokens(accessToken, refreshToken);

  const getInstallId = async () => getDeviceId();

  return (
    <View style={{ flex: 1 }}>
      <LittleWorldWebLazy
        ref={webViewRef}
        dom={{
          allowsBackForwardNavigationGestures: true,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          // Expose the WebView to chrome://inspect (Android) / Safari Develop (iOS) in dev.
          webviewDebuggingEnabled: __DEV__,
          onLoad: () => {
            pageLoadedRef.current = true;
          },
        }}
        sendToReactNative={sendToReactNative}
        apiFetchNative={fetcher}
        refreshAccessToken={refreshAccessTokens}
        getAccessToken={getAccessToken}
        setAccessTokens={setAccessTokens}
        getInstallId={getInstallId}
        hasStoredToken={hasStoredToken}
        safeTop={insets.top}
        safeBottom={insets.bottom}
        safeLeft={insets.left}
        safeRight={insets.right}
      />
    </View>
  );
}
