import { useEffect, useState } from 'react';
import { BackHandler, Platform, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiFetch,
  ApiFetchOptions,
  refreshAccessTokens,
  updateTokens,
} from '@/src/api/helpers';
import { useAuthStore } from '@/src/store/authStore';

import { useDomCommunicationContext } from './DomCommunicationCore';
import LittleWorldWebLazy from './LittleWorldWebLazy';

export default function DomWebViewHost() {
  const { domRef, sendToReactNative, sendToDom } = useDomCommunicationContext();
  const insets = useSafeAreaInsets();

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
    accessToken: string | undefined,
    refreshToken: string | undefined,
  ): Promise<void> => {
    console.log('frontend setting access tokens', accessToken, refreshToken);
    await updateTokens(accessToken, refreshToken);
  };

  return (
    <View style={{ flex: 1 }}>
      <LittleWorldWebLazy
        ref={domRef}
        sendToReactNative={sendToReactNative}
        apiFetchNative={fetcher}
        refreshAccessToken={refreshAccessTokens}
        getAccessToken={getAccessToken}
        setAccessTokens={setAccessTokens}
        hasStoredToken={hasStoredToken}
        safeTop={insets.top}
        safeBottom={insets.bottom}
        safeLeft={insets.left}
        safeRight={insets.right}
      />
    </View>
  );
}
