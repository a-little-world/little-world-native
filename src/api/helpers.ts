import { environment } from "@/environment";
import * as AppIntegrity from "@expo/app-integrity";
import type {
  IntegrityCheck,
  IntegrityCheckAndroid,
  IntegrityCheckIOS,
  IntegrityCheckRequestData,
  IntegrityCheckRequestDataAndroid,
  IntegrityCheckRequestDataIOS,
  IntegrityCheckRequestDataWeb,
} from "littleplanet";
import { Platform } from "react-native";
import { API_FIELDS } from "../constants";
import { Cookies } from "../constants/CookieMock";
import PlatformSecureStore, * as SecureStore from "../helpers/secureStore";
import { authStore, useAuthStore } from "../store/authStore";

import environmentNative from "@/environments/env";
import {
  debugStore,
  FetchError,
  getEffectiveBackendUrl,
} from "../store/debugStore";
import { domCommunicationStore } from "../store/domCommunicationStore";

export async function navigateToLogin(expired: boolean = false): Promise<void> {
  // Delegate navigation to frontend
  const { sendToDom } = domCommunicationStore.get();
  await sendToDom?.({
    action: "NAVIGATE_TO_LOGIN",
    payload: { sessionExpired: expired },
  });
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiFetchOptions {
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

interface IntegrityChallenge {
  challenge: string;
  challengeId: string;
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
  options: ApiFetchOptions = {},
  source: FetchError["source"] = "native",
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
      `${getEffectiveBackendUrl()}${endpoint}`,
      fetchOptions,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.code === "token_not_valid") {
        throw { ...errorData, status: response.status };
      }
      throw formatApiError(errorData, response);
    }

    try {
      return (await response.json()) as T;
    } catch (_e) {
      return null as T;
    }
  } catch (error: any) {
    if (debugStore.get().debugEnabled) {
      if (error instanceof TypeError) {
        debugStore.get().addFetchError({
          source,
          method,
          endpoint,
          url: `${getEffectiveBackendUrl()}${endpoint}`,
          headers: fetchOptions.headers as Record<string, string>,
          requestBody: body,
          status: (error as any)?.status ?? 999,
          error: {
            type: "TypeError",
            message: error.message,
            details:
              "Possible causes: Internect connection issues or CORS error",
          },
        });
      } else {
        debugStore.get().addFetchError({
          source,
          method,
          endpoint,
          url: `${getEffectiveBackendUrl()}${endpoint}`,
          headers: fetchOptions.headers as Record<string, string>,
          requestBody: body,
          status: (error as any)?.status,
          error,
        });
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
        `Platform ${Platform.OS} not supported for integrity check`,
      );
  }
}

async function requestIntegrityCheckAndroid(): Promise<IntegrityCheckAndroid> {
  const { challenge, challengeId } = await fetchIntegrityChallenge();
  const cloudProjectNumber = environmentNative.googleCloudProjectNumber;
  await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProjectNumber);
  const integrityToken =
    await AppIntegrity.requestIntegrityCheckAsync(challenge);

  return { platform: "android", challengeId, integrityToken };
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

  const { challenge, challengeId } = await fetchIntegrityChallenge();

  try {
    const attestationObject = await AppIntegrity.attestKeyAsync(
      keyId,
      challenge,
    );
    return { platform: "ios", keyId, challengeId, attestationObject };
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

async function fetchIntegrityChallenge(): Promise<IntegrityChallenge> {
  return apiFetch("/api/integrity/challenge", {
    method: "POST",
  });
}

// redaclaration from frontend since import functions/constant functions seems to cause issues.
export function getIntegrityCheckRequestData(
  integrityCheck: IntegrityCheck,
): IntegrityCheckRequestData {
  if (integrityCheck.platform === "android") {
    return {
      challenge_id: integrityCheck.challengeId,
      integrity_token: integrityCheck.integrityToken,
    } satisfies IntegrityCheckRequestDataAndroid;
  }
  if (integrityCheck.platform === "ios") {
    return {
      key_id: integrityCheck.keyId,
      challenge_id: integrityCheck.challengeId,
      attestation_object: integrityCheck.attestationObject,
    } satisfies IntegrityCheckRequestDataIOS;
  }
  if (integrityCheck.platform === "web") {
    return {
      bypass_token: integrityCheck.bypassToken,
    } satisfies IntegrityCheckRequestDataWeb;
  }
  throw new Error(`Unsupported platform for integrity check request data`);
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
  accessToken: string | undefined,
  refreshToken: string | undefined,
) {
  try {
    if (SecureStore && typeof SecureStore.setItemAsync === "function") {
      if (accessToken !== undefined) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      }

      if (refreshToken !== undefined) {
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

  return { accessToken, refreshToken };
}

export enum TokenStatus {
  VALID,
  EXPIRED,
  MISSING,
}

export async function updateTokens(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<void> {
  const { setAccessToken, setRefreshToken } = useAuthStore.getState();

  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  await saveJwtTokens(accessToken, refreshToken);
}

let accessTokenRefresh: Promise<TokenStatus> | undefined = undefined;
export async function refreshAccessTokens(): Promise<TokenStatus> {
  if (accessTokenRefresh) {
    return accessTokenRefresh;
  }

  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    await updateTokens(undefined, undefined);
    return TokenStatus.MISSING;
  }

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

  accessTokenRefresh = (async (): Promise<TokenStatus> => {
    try {
      const { sendToDom } = domCommunicationStore.get();
      if (!sendToDom) {
        await updateTokens(undefined, undefined);
        return TokenStatus.MISSING;
      }

      const integrityData = await requestIntegrityCheck();
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: { ...defaultHeaders, ...authHeaders },
        body: JSON.stringify({
          refresh: refreshToken,
          ...getIntegrityCheckRequestData(integrityData),
        }),
      };

      const response = await fetch(
        `${getEffectiveBackendUrl()}/api/token/refresh/${
          integrityData.platform
        }`,
        fetchOptions,
      );

      const responseBody = await response.json().catch(() => {});
      const { access, refresh } = responseBody;

      await updateTokens(access, refresh);
      if (!response.ok) {
        return TokenStatus.EXPIRED;
      }

      if (access && refresh) {
        return TokenStatus.VALID;
      }

      return TokenStatus.EXPIRED;
    } catch (_e) {
      await updateTokens(undefined, undefined);
      return TokenStatus.EXPIRED;
    } finally {
      accessTokenRefresh = undefined;
    }
  })();

  return accessTokenRefresh;
}
