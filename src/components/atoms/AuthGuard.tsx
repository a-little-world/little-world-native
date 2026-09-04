import { ReactNode, useMemo, useRef } from 'react';

import useSWR from 'swr';

import { IS_AUTHENTICATED_ENDPOINT } from '@/src/api';
import { useAuthStore } from '@/src/store/authStore';

function AuthGuard({ children }: { children: ReactNode }) {
  const { data: authenticated, isValidating } = useSWR<boolean>(
    IS_AUTHENTICATED_ENDPOINT,
    {
      refreshInterval: isAuthenticated => {
        // keep polling every 3s until authenticated
        if (isAuthenticated !== true) {
          return 3000;
        }
        return 0;
      },
    },
  );
  const { tokenState } = useAuthStore();

  // Store previous authenticated state to prevent flickering during loading/token refresh
  const prevAuthenticatedRef = useRef<boolean>(false);

  const isAuthenticated = useMemo(() => {
    // During loading, maintain previous state
    if (isValidating || tokenState?.isRefreshing) {
      return prevAuthenticatedRef.current;
    }

    prevAuthenticatedRef.current = Boolean(authenticated);

    return Boolean(authenticated);
  }, [authenticated, isValidating, tokenState]);

  return isAuthenticated ? children : null;
}

export default AuthGuard;
