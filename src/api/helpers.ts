import { environment } from "@/environment";
import * as AppIntegrity from "@expo/app-integrity";
import { router } from "expo-router";
import {
  IntegrityCheck,
  IntegrityCheckAndroid,
  IntegrityCheckIOS,
} from "littleplanet";
import { Platform } from "react-native";
import uuid from "react-native-uuid";
import { API_FIELDS } from "../constants";
import { Cookies } from "../constants/CookieMock";
import PlatformSecureStore, * as SecureStore from "../helpers/secureStore";
import { authStore, useAuthStore } from "../store/authStore";

import environmentNative from "@/environments/env";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiFetchOptions {
  method?: HttpMethod;
  body?: object | FormData;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  useTagsOnly?: boolean;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

export const formatApiError = (responseBody: any, response: any) => {
  const apiError: ApiError = new Error("API request failed");
  apiError.status = response.status;
  apiError.statusText = response.statusText;
  apiError.data = responseBody;
  if (typeof responseBody === "string") {
    apiError.message = responseBody;
  } else {
    const errorTypeApi = Object.keys(responseBody)?.[0];
    const errorType =
      API_FIELDS[errorTypeApi as keyof typeof API_FIELDS] ?? errorTypeApi;
    const errorTags = Object.values(responseBody)?.[0];
    const errorTag = Array.isArray(errorTags) ? errorTags[0] : errorTags;

    apiError.cause = errorType ?? null;
    apiError.message =
      apiError.data?.message || errorTag || apiError.statusText;
  }

  return apiError;
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    credentials = "same-origin",
    useTagsOnly = true,
  } = options;

  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRFToken": Cookies.get("csrftoken") || "",
  };
  if (environment.allowNgrokRequests) {
    defaultHeaders["ngrok-skip-browser-warning"] = "69420";
  }

  if (useTagsOnly) {
    defaultHeaders["X-UseTagsOnly"] = "true";
  }

  const authHeaders = {
    "X-CSRF-Bypass-Token": "abc",
  } as Record<string, string>;
  const { accessToken } = authStore.get();
  if (accessToken) {
    authHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...headers, ...authHeaders },
    credentials,
  };

  if (body) {
    if (body instanceof FormData) {
      fetchOptions.body = body;
      // Remove Content-Type header when sending FormData
      delete (fetchOptions.headers as Record<string, string>)["Content-Type"];
    } else {
      fetchOptions.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(
      `${environment.backendUrl}${endpoint}`,
      fetchOptions
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw formatApiError(errorData, response);
    }

    try {
      return (await response.json()) as T;
    } catch (_e) {
      return null as T;
    }
  } catch (error: any) {
    if (error?.status === 401) {
      try {
        const tokenRefreshed = await refreshAccessTokens();
        if (tokenRefreshed) {
          return apiFetch(endpoint, options);
        } else {
          // refresh token expired -> navigate to login
          router.navigate("/");
        }
      } catch (err: any) {
        const response = err.cause;
        const errorData = await response.json().catch(() => ({}));
        throw formatApiError(errorData, response);
      }
    }

    console.error(`API Fetch Error (${endpoint}):`, error);
    throw error;
  }
}

// Integrity check logic

const APP_INTEGRITY_KEY_ID_KEY = "APP_INTEGRITY_KEY_ID";

export async function requestIntegrityCheck(): Promise<IntegrityCheck> {
  switch (Platform.OS) {
    case "android":
      return requestIntegrityCheckAndroid();
    case "macos":
    case "ios":
      return requestIntegrityCheckIOS();
    case "web":
      return requestIntegrityCheckWeb();
    default:
      throw new Error(
        `Platform ${Platform.OS} not supported for integrity check`
      );
  }
}

async function requestIntegrityCheckAndroid(): Promise<IntegrityCheckAndroid> {
  const keyId = uuid.v4();

  const { challenge } = await apiFetch("/api/integrity/challenge", {
    method: "POST",
    body: { keyId },
  });
  const cloudProjectNumber = environmentNative.googleCloudProjectNumber;
  await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProjectNumber);
  const integrityToken = await AppIntegrity.requestIntegrityCheckAsync(
    challenge
  );

  return { platform: "android", integrityToken, keyId };
}

async function requestIntegrityCheckIOS(): Promise<IntegrityCheckIOS> {
  if (!AppIntegrity.isSupported) {
    throw new Error("Integrity check not supported on device");
  }

  let keyId = await PlatformSecureStore.getItemAsync(APP_INTEGRITY_KEY_ID_KEY);
  if (!keyId) {
    keyId = await AppIntegrity.generateKeyAsync();

    await PlatformSecureStore.setItemAsync(APP_INTEGRITY_KEY_ID_KEY, keyId);
  }

  const { challenge } = await apiFetch("/api/integrity/challenge", {
    method: "POST",
    body: { keyId },
  });

  try {
    const attestationObject = await AppIntegrity.attestKeyAsync(
      keyId,
      challenge
    );
    return { platform: "ios", attestationObject, keyId };
  } catch (error) {
    if (error !== "ERR_APP_INTEGRITY_SERVER_UNAVAILABLE") {
      await PlatformSecureStore.deleteItemAsync(APP_INTEGRITY_KEY_ID_KEY);
    }
    throw new Error("Integrity check failed", { cause: error });
  }
}

async function requestIntegrityCheckWeb(): Promise<IntegrityCheck> {
  return { platform: "web", bypassToken: "bypassChangeMe!" };
}

// Token logic

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
