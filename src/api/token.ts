import { environment } from "@/environment";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { useAuthStore } from "../store/authStore";

const ACCESS_TOKEN_KEY = "dom_auth_access_token";
const REFRESH_TOKEN_KEY = "dom_auth_refresh_token";

async function getAccessJwtToken() {
  try {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      if (SecureStore && typeof SecureStore.getItemAsync === "function") {
        return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      }
    }
  } catch {}
  return null;
}

async function getRefreshJwtToken() {
  try {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      if (SecureStore && typeof SecureStore.getItemAsync === "function") {
        return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      }
    }
  } catch {}
  return null;
}

export async function loadStoredTokensIntoStore() {
  const accessToken = (await getAccessJwtToken()) ?? undefined;
  const refreshToken = (await getRefreshJwtToken()) ?? undefined;

  console.log("setting tokens in authStore", accessToken, refreshToken);
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
    "ngrok-skip-browser-warning": "69420", // use for development only!
  };
  const authHeaders = {
    "X-CSRF-Bypass-Token": "abc",
  } as Record<string, string>;
  const fetchOptions: RequestInit = {
    method: "POST",
    headers: { ...defaultHeaders, ...authHeaders },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  };

  if (!refreshToken) {
    return false;
  }

  accessTokenRefresh = fetch(
    `${environment.backendUrl}/api/token/refresh`,
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
