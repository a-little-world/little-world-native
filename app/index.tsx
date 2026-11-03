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

setupReactErrorTracking();

export default function Page() {
  const [tokensLoaded, setTokensLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await loadStoredTokensIntoStore();
      await refreshAccessTokens(); // also sets authStore tokenState
      setTokensLoaded(true);
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
    registerInstallation()
      .then(registerFirebaseDeviceToken)
      .catch(() => {});
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
