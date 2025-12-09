import { environment } from "@/environment";
import { requestIntegrityCheck } from "../helpers/integrityCheck";
import * as SecureStore from "../helpers/secureStore";
import { useAuthStore } from "../store/authStore";

const ACCESS_TOKEN_KEY = "dom_auth_access_token";
const REFRESH_TOKEN_KEY = "dom_auth_refresh_token";

export async function getAccessJwtToken() {
  try {
    if (SecureStore && typeof SecureStore.getItemAsync === "function") {
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function getRefreshJwtToken() {
  try {
    if (SecureStore && typeof SecureStore.getItemAsync === "function") {
      return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function saveJwtTokens(
  accessToken: string | null,
  refreshToken: string | null
) {
  try {
    if (SecureStore && typeof SecureStore.setItemAsync === "function") {
      if (accessToken !== null) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      }

      if (refreshToken !== null) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
  } catch {}
}

export async function clearJwtTokens() {
  try {
    if (SecureStore && typeof SecureStore.deleteItemAsync === "function") {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

export async function loadStoredTokensIntoStore() {
  const accessToken = (await getAccessJwtToken()) ?? undefined;
  const refreshToken = (await getRefreshJwtToken()) ?? undefined;

  useAuthStore.setState({ accessToken, refreshToken });
}

let accessTokenRefresh: Promise<boolean> | undefined = undefined;
export async function refreshAccessTokens(): Promise<boolean> {
  if (accessTokenRefresh) {
    return accessTokenRefresh;
  }

  const { refreshToken } = useAuthStore.getState();
  console.log("refreshToken", refreshToken);

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (environment.allowNgrokRequests) {
    defaultHeaders["ngrok-skip-browser-warning"] = "69420";
  }
  const authHeaders = {
    "X-CSRF-Bypass-Token": "abc",
  } as Record<string, string>;

  const integrityData = await requestIntegrityCheck();

  const fetchOptions: RequestInit = {
    method: "POST",
    headers: { ...defaultHeaders, ...authHeaders },
    body: JSON.stringify({
      refresh: refreshToken,
      ...integrityData,
    }),
  };

  if (!refreshToken) {
    return false;
  }

  accessTokenRefresh = fetch(
    `${environment.backendUrl}/api/token/refresh${integrityData.platform}`,
    fetchOptions
  )
    .then(async (res) => {
      if (res.ok) {
        const { access, refresh }: { access: string; refresh: string } =
          await res.json();

        useAuthStore.setState({ accessToken: access, refreshToken: refresh });
        return true;
      }

      if (res.status === 403) {
        // refresh token expired
        console.warn("refresh token expired");
        return false;
      }

      throw new Error(undefined, { cause: res });
    })
    .finally(() => (accessTokenRefresh = undefined));

  return accessTokenRefresh;
}
