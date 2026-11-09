import { ReactNode, useState } from 'react';

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
  const [prevAuthenticated, setPrevAuthenticated] = useState(false);
  const loading = isValidating || tokenState?.isRefreshing;
  const current = Boolean(authenticated);
  if (!loading && current !== prevAuthenticated) {
    setPrevAuthenticated(current);
  }

  const isAuthenticated = loading ? prevAuthenticated : current;

  return isAuthenticated ? children : null;
}

export default AuthGuard;
