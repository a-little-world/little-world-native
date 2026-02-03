import { apiFetch } from "@/src/api/helpers";
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
        // keep polling every 2s until ready === true
        if (!isAuthenticated) return 2000;
        return 0;
      },
    },
  );

  const authStore = useAuthStore();

  // check authentication status when tokens change
  useEffect(() => {
    mutate(IS_AUTHENTICATED_ENDPOINT);
  }, [authStore]);

  // TODO: should also check 1. 'session_id' present
  // 2. if 'session_id' & user present, else fetch userData
  const isAuthenticated = data && !isLoading && !error;
  return isAuthenticated ? children : null;
}

export default AuthGuard;
