// Page.tsx
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { mutate } from 'swr';

import { IS_AUTHENTICATED_ENDPOINT } from '@/src/api';
import {
  loadStoredTokensIntoStore,
  refreshAccessTokens,
} from '@/src/api/helpers';
import AuthGuard from '@/src/components/atoms/AuthGuard';
import DomWebViewHost from '@/src/components/blocks/DomWebViewHost';
import FireBase from '@/src/components/blocks/Firebase';
import { setupReactErrorTracking } from '@/src/store/debugStore';

setupReactErrorTracking();

export default function Page() {
  const [tokensLoaded, setTokensLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await loadStoredTokensIntoStore();
      await refreshAccessTokens();
      setTokensLoaded(true);
      mutate(IS_AUTHENTICATED_ENDPOINT);
    })();
  }, [setTokensLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <AuthGuard>{Platform.OS !== 'web' && <FireBase />}</AuthGuard>
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: '100%', display: 'block' }}>
        {tokensLoaded && <DomWebViewHost />}
      </View>
    </View>
  );
}
