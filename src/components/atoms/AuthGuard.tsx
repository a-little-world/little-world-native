import { apiFetch, refreshAccessTokens } from "@/src/api/helpers";
import { useAuthStore } from "@/src/store/authStore";
import { useEffect } from "react";
import useSWR, { mutate } from "swr";

const IS_AUTHENTICATED_ENDPOINT = "/api/user/authenticated";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading } = useSWR<boolean>(
    IS_AUTHENTICATED_ENDPOINT,
    apiFetch,
    {
      refreshInterval: (isAuthenticated) => {
        // keep polling every 3s until authenticated
        if (isAuthenticated !== true) {
          refreshAccessTokens();
          return 3000;
        }
        return 0;
      },
    },
  );

  const { refreshToken } = useAuthStore();

  // check authentication status when tokens change
  useEffect(() => {
    mutate(IS_AUTHENTICATED_ENDPOINT);
  }, [refreshToken]);

  const isAuthenticated = data && !isLoading && !error;
  return isAuthenticated ? children : null;
}

export default AuthGuard;
