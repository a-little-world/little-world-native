// Page.tsx
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mutate } from 'swr';

import { IS_AUTHENTICATED_ENDPOINT } from '@/src/api';
import {
  loadStoredTokensIntoStore,
  refreshAccessTokens,
} from '@/src/api/helpers';
import DomWebViewHost from '@/src/components/blocks/DomWebViewHost';
import FireBase from '@/src/components/blocks/Firebase';
import { setupReactErrorTracking } from '@/src/store/debugStore';

setupReactErrorTracking();

export default function Page() {
  const [tokensLoaded, setTokensLoaded] = useState(false);

  const insets = useSafeAreaInsets();
  useEffect(() => {
    (async () => {
      await loadStoredTokensIntoStore();
      await refreshAccessTokens(); // also sets authStore tokenState
      setTokensLoaded(true);
      mutate(IS_AUTHENTICATED_ENDPOINT);
    })();
  }, [setTokensLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS !== 'web' && <FireBase />}
      <View style={{ height: insets.top, backgroundColor: '#fff' }} />
      <StatusBar style="dark" />
      <View style={{ flex: 1, width: '100%', display: 'block' }}>
        {tokensLoaded && <DomWebViewHost />}
      </View>
    </View>
  );
}
