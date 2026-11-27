import { useEffect } from 'react';
import { DevSettings } from 'react-native';

import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { getAccessJwtToken, saveJwtTokens } from '@/src/api/helpers';

// Dev builds only, for test automation: littleworld-dev://e2e-login?access=…&refresh=…
// stores the tokens and reloads, so the app starts fresh as that user.
export default function E2ELogin() {
  const { access, refresh } = useLocalSearchParams<{
    access?: string;
    refresh?: string;
  }>();

  useEffect(() => {
    if (!__DEV__ || !access || !refresh) return;
    (async () => {
      // the reload can deliver the same link again
      if ((await getAccessJwtToken()) === access) {
        router.replace('/');
        return;
      }
      await saveJwtTokens(access, refresh);
      DevSettings.reload();
    })();
  }, [access, refresh]);

  if (!__DEV__ || !access || !refresh) return <Redirect href="/" />;
  return null;
}
