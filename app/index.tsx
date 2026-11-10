// Page.tsx
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import useSWR, { mutate } from 'swr';

import { IS_AUTHENTICATED_ENDPOINT } from '@/src/api';
import {
  apiFetch,
  loadStoredTokensIntoStore,
  refreshAccessTokens,
} from '@/src/api/helpers';
import DomWebViewHost from '@/src/components/blocks/DomWebViewHost';
import FireBase from '@/src/components/blocks/Firebase';
import { setupReactErrorTracking } from '@/src/store/debugStore';
import { registerFirebaseDeviceToken } from '@/src/utils/firebase-util';
import { registerInstallation } from '@/src/utils/installation';
import { retry } from '@/src/utils/retry';

setupReactErrorTracking();

export default function Page() {
  const [tokensLoaded, setTokensLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await loadStoredTokensIntoStore();
      // webview loads in parallel; frontend waits on tokenState
      setTokensLoaded(true);
      await refreshAccessTokens(); // also sets authStore tokenState
      mutate(IS_AUTHENTICATED_ENDPOINT);
    })();
  }, [setTokensLoaded]);

  const { data: isAuthenticated } = useSWR<boolean>(
    tokensLoaded ? IS_AUTHENTICATED_ENDPOINT : null,
    apiFetch,
  );

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated) {
      return;
    }
    const controller = new AbortController();
    retry(registerInstallation, controller.signal)
      .then(() => retry(registerFirebaseDeviceToken, controller.signal))
      .catch(() => {});
    return () => controller.abort();
  }, [isAuthenticated]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS !== 'web' && <FireBase />}
      <View style={{ backgroundColor: '#fff' }} />
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: '100%' }}>
        {tokensLoaded && <DomWebViewHost />}
      </View>
    </View>
  );
}
