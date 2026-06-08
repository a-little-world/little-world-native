import { IS_AUTHENTICATED_ENDPOINT } from "@/src/api";
import useSWR from "swr";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading } = useSWR<boolean>(
    IS_AUTHENTICATED_ENDPOINT,
    {
      refreshInterval: (isAuthenticated) => {
        // keep polling every 3s until authenticated
        if (isAuthenticated !== true) {
          return 3000;
        }
        return 0;
      },
    },
  );

  const isAuthenticated = data && !isLoading && !error;
  return isAuthenticated ? children : null;
}

export default AuthGuard;
