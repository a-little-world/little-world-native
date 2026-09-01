import { Platform } from 'react-native';

import * as AppIntegrity from '@expo/app-integrity';
import { mutate } from 'swr';

import { environment } from '@/environment';
import environmentNative from '@/environments/env';
import type {
  IntegrityCheck,
  IntegrityCheckAndroid,
  IntegrityCheckIOS,
  IntegrityCheckRequestData,
  IntegrityCheckRequestDataAndroid,
  IntegrityCheckRequestDataIOS,
  IntegrityCheckRequestDataWeb,
} from '@/frontend/src';

import { IS_AUTHENTICATED_ENDPOINT } from '.';
import { API_FIELDS } from '../constants';
import { Cookies } from '../constants/CookieMock';
import PlatformSecureStore, * as SecureStore from '../helpers/secureStore';
import { authStore, useAuthStore } from '../store/authStore';
import {
  debugStore,
  FetchError,
  getEffectiveBackendUrl,
  useDebugStore,
} from '../store/debugStore';
import { domCommunicationStore } from '../store/domCommunicationStore';

export async function navigateToLogin(expired: boolean = false): Promise<void> {
  // Delegate navigation to frontend
  const { sendToDom } = domCommunicationStore.get();
  await sendToDom?.({
    action: 'NAVIGATE_TO_LOGIN',
    payload: { sessionExpired: expired },
  }).catch(error => {
    console.warn('NAVIGATE_TO_LOGIN failed to reach the WebView', error);
  });
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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

const REFRESH_WAIT_TIMEOUT = 15_000;
const REFRESH_THRESHOLD = 30_000;
const MIN_REFRESH_DELAY = 10_000;

export const formatApiError = (responseBody: any, response: any) => {
  const apiError: ApiError = new Error('API request failed');
  apiError.status = response.status;
  apiError.statusText = response.statusText;
  apiError.data = responseBody;
  if (typeof responseBody === 'string') {
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

async function apiFetchOnce<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {},
  source: FetchError['source'] = 'native',
): Promise<T> {
  if (accessTokenRefresh) {
    await accessTokenRefresh;
  }

  const {
    method = 'GET',
    body,
    headers = {},
    credentials = 'same-origin',
    useTagsOnly = true,
  } = options;

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-CSRFToken': Cookies.get('csrftoken') || '',
  };
  if (environment.allowNgrokRequests) {
    defaultHeaders['ngrok-skip-browser-warning'] = '69420';
  }

  if (useTagsOnly) {
    defaultHeaders['X-UseTagsOnly'] = 'true';
  }

  const authHeaders = {
    'X-CSRF-Bypass-Token': 'abc',
  } as Record<string, string>;
  const { accessToken } = useAuthStore.getState();
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
      delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
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
      if (errorData?.code === 'token_not_valid') {
        throw {
          ...errorData,
          status: response.status,
          message: errorData.detail ?? 'Token not valid',
        };
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
            type: 'TypeError',
            message: error.message,
            details:
              'Possible causes: Internect connection issues or CORS error',
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

    throw error instanceof Error
      ? {
          message: error.message,
          status: (error as any).status,
          statusText: (error as any).statusText,
          data: (error as any).data,
          code: (error as any).data?.code,
          cause: (error as any).cause,
        }
      : error;
  }
}

type TokenError = {
  status?: number;
  code?: string;
  data?: { code?: string };
};

function isTokenError(error: TokenError | undefined | null): boolean {
  const tokenMissingError =
    error?.status === 403 && !useAuthStore.getState().accessToken;
  return (
    error?.status === 401 ||
    error?.code === 'token_not_valid' ||
    error?.data?.code === 'token_not_valid' ||
    tokenMissingError
  );
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {},
  source: FetchError['source'] = 'native',
): Promise<T> {
  try {
    const result = await apiFetchOnce<T>(endpoint, options, source);

    if (endpoint === IS_AUTHENTICATED_ENDPOINT && result === false) {
      const status = await refreshAccessTokens(true);
      if (status === TokenStatus.VALID) {
        return apiFetchOnce<T>(endpoint, options, source);
      }
    }

    return result;
  } catch (error: any) {
    if (!isTokenError(error)) throw error;

    const status = await refreshAccessTokens(true);
    if (status === TokenStatus.VALID) {
      return apiFetchOnce<T>(endpoint, options, source);
    }

    if (status !== TokenStatus.ERROR) {
      await navigateToLogin(true);
    }
    throw error;
  }
}

// Integrity check logic

const APP_INTEGRITY_KEY_ID_KEY = 'APP_INTEGRITY_KEY_ID';

export async function requestIntegrityCheck(): Promise<IntegrityCheck> {
  const { bypassIntegrityChecks, integrityBypassToken } =
    useDebugStore.getState();
  if (bypassIntegrityChecks && integrityBypassToken) {
    return bypassIntegrityCheck(integrityBypassToken);
  }

  switch (Platform.OS) {
    case 'android':
      return requestIntegrityCheckAndroid();
    case 'macos':
    case 'ios':
      return requestIntegrityCheckIOS();
    case 'web':
      return requestIntegrityCheckWeb();
    default:
      throw new Error(
        `Platform ${Platform.OS} not supported for integrity check`,
      );
  }
}

async function bypassIntegrityCheck(
  bypassToken: string,
): Promise<IntegrityCheck> {
  switch (Platform.OS) {
    case 'android':
      return {
        platform: 'android',
        challengeId: 'bypass',
        integrityToken: 'bypass',
        bypassToken,
      };
    case 'macos':
    case 'ios':
      return {
        platform: 'ios',
        keyId: 'bypass',
        challengeId: 'bypass',
        attestationObject: 'bypass',
        bypassToken,
      };
    case 'web':
      return { platform: 'web', bypassToken };
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

  return { platform: 'android', challengeId, integrityToken };
}

async function requestIntegrityCheckIOS(): Promise<IntegrityCheckIOS> {
  if (!AppIntegrity.isSupported) {
    throw new Error('Integrity check not supported on device');
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
    return { platform: 'ios', keyId, challengeId, attestationObject };
  } catch (error) {
    if (error !== 'ERR_APP_INTEGRITY_SERVER_UNAVAILABLE') {
      await PlatformSecureStore.deleteItemAsync(APP_INTEGRITY_KEY_ID_KEY);
    }
    throw new Error('Integrity check failed', { cause: error });
  }
}

async function requestIntegrityCheckWeb(): Promise<IntegrityCheck> {
  return { platform: 'web', bypassToken: 'bypassChangeMe!' };
}

async function fetchIntegrityChallenge(): Promise<IntegrityChallenge> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-CSRFToken': Cookies.get('csrftoken') || '',
    'X-CSRF-Bypass-Token': 'abc',
  };
  if (environment.allowNgrokRequests) {
    headers['ngrok-skip-browser-warning'] = '69420';
  }

  const response = await fetch(
    `${getEffectiveBackendUrl()}/api/integrity/challenge`,
    { method: 'POST', headers },
  );

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw formatApiError(responseBody, response);
  }

  return responseBody as IntegrityChallenge;
}

// redaclaration from frontend since import functions/constant functions seems to cause issues.
export function getIntegrityCheckRequestData(
  integrityCheck: IntegrityCheck,
): IntegrityCheckRequestData {
  if (integrityCheck.platform === 'android') {
    return {
      challenge_id: integrityCheck.challengeId,
      integrity_token: integrityCheck.integrityToken,
      bypass_token: integrityCheck.bypassToken,
    } satisfies IntegrityCheckRequestDataAndroid;
  }
  if (integrityCheck.platform === 'ios') {
    return {
      key_id: integrityCheck.keyId,
      challenge_id: integrityCheck.challengeId,
      attestation_object: integrityCheck.attestationObject,
      bypass_token: integrityCheck.bypassToken,
    } satisfies IntegrityCheckRequestDataIOS;
  }
  if (integrityCheck.platform === 'web') {
    return {
      bypass_token: integrityCheck.bypassToken,
    } satisfies IntegrityCheckRequestDataWeb;
  }
  throw new Error(`Unsupported platform for integrity check request data`);
}

// Token logic

const ACCESS_TOKEN_KEY = 'dom_auth_access_token';
const REFRESH_TOKEN_KEY = 'dom_auth_refresh_token';
const INTEGRITY_BYPASS_TOKEN_KEY = 'dom_auth_integrity_bypass_token';

export async function getAccessJwtToken() {
  try {
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function getRefreshJwtToken() {
  try {
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function saveJwtTokens(
  accessToken: string | undefined | null,
  refreshToken: string | undefined | null,
) {
  try {
    if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
      if (accessToken) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      }

      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
    }
  } catch {}
}

export async function clearJwtTokens() {
  try {
    if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

export async function getIntegrityBypassToken() {
  try {
    if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return SecureStore.getItemAsync(INTEGRITY_BYPASS_TOKEN_KEY);
    }
  } catch {}
  return null;
}

export async function saveIntegrityBypassToken(token: string | null) {
  try {
    if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
      if (token) {
        await SecureStore.setItemAsync(INTEGRITY_BYPASS_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(INTEGRITY_BYPASS_TOKEN_KEY);
      }
    }
  } catch {}
}

export async function loadStoredTokensIntoStore() {
  const accessToken = (await getAccessJwtToken()) ?? undefined;
  const refreshToken = (await getRefreshJwtToken()) ?? undefined;
  const integrityBypassToken = await getIntegrityBypassToken();

  useAuthStore.setState({ accessToken, refreshToken });
  useDebugStore.setState({ integrityBypassToken });

  scheduleTokenRefresh();

  return { accessToken, refreshToken };
}

export enum TokenStatus {
  VALID,
  EXPIRED,
  MISSING,
  ERROR,
}

export async function updateTokens(
  accessToken: string | undefined | null,
  refreshToken: string | undefined | null,
): Promise<void> {
  const { setAccessToken, setRefreshToken } = useAuthStore.getState();

  setAccessToken(accessToken ?? undefined);
  setRefreshToken(refreshToken ?? undefined);

  mutate(IS_AUTHENTICATED_ENDPOINT);

  await saveJwtTokens(accessToken, refreshToken);

  scheduleTokenRefresh();
}

function getTokenExpiry(token: string | undefined): number | undefined {
  try {
    const payload = token?.split('.')?.[1];
    if (!payload) return undefined;
    const { exp } = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    );
    return typeof exp === 'number' ? exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function getAccessTokenLifetime(): number {
  const expiry = getTokenExpiry(useAuthStore.getState().accessToken);
  const lifetime = expiry === undefined ? 0 : Math.max(0, expiry - Date.now());
  return lifetime;
}

let tokenRefreshTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleTokenRefresh() {
  if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
  tokenRefreshTimer = undefined;

  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return;

  const delay = Math.max(
    getAccessTokenLifetime() - REFRESH_THRESHOLD,
    MIN_REFRESH_DELAY,
  );

  tokenRefreshTimer = setTimeout(() => {
    refreshAccessTokens();
  }, delay);
}

let accessTokenRefresh: Promise<TokenStatus> | undefined = undefined;
export async function refreshAccessTokens(force = false): Promise<TokenStatus> {
  if (accessTokenRefresh) {
    return accessTokenRefresh;
  }

  const { refreshToken, tokenState: currentTokenState } =
    useAuthStore.getState();
  if (!refreshToken) {
    useAuthStore.setState({
      tokenState: {
        isRefreshing: false,
        status: TokenStatus.MISSING,
      },
    });
    await syncTokenStateToDom();
    return TokenStatus.MISSING;
  }

  const shouldRefresh = force || getAccessTokenLifetime() <= REFRESH_THRESHOLD;
  if (!shouldRefresh) {
    useAuthStore.setState({
      tokenState: {
        isRefreshing: false,
        status: TokenStatus.VALID,
      },
    });
    await syncTokenStateToDom();
    return TokenStatus.VALID;
  }

  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (environment.allowNgrokRequests) {
    defaultHeaders['ngrok-skip-browser-warning'] = '69420';
  }
  const authHeaders = {
    'X-CSRF-Bypass-Token': 'abc',
  } as Record<string, string>;

  useAuthStore.setState({
    tokenState: {
      isRefreshing: true,
      status: currentTokenState?.status,
    },
  });
  syncTokenStateToDom();
  accessTokenRefresh = (async (): Promise<TokenStatus> => {
    try {
      const integrityData = await requestIntegrityCheck();
      const fetchOptions: RequestInit = {
        method: 'POST',
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

      const responseBody = await response.json().catch(() => ({}));
      const { access, refresh } = responseBody ?? {};

      if (response.ok && access && refresh) {
        await updateTokens(access, refresh);
        return TokenStatus.VALID;
      }

      if (isTokenError({ ...responseBody, status: response.status })) {
        await updateTokens(undefined, undefined);
        return TokenStatus.EXPIRED;
      }

      return TokenStatus.ERROR;
    } catch (_e) {
      return TokenStatus.ERROR;
    } finally {
      accessTokenRefresh = undefined;
    }
  })();

  const tokenStatus = await Promise.race<TokenStatus>([
    accessTokenRefresh,
    new Promise(resolve =>
      setTimeout(() => resolve(TokenStatus.ERROR), REFRESH_WAIT_TIMEOUT),
    ),
  ]);

  if (tokenStatus === TokenStatus.ERROR) {
    scheduleTokenRefresh();
  }

  useAuthStore.setState({
    tokenState: {
      isRefreshing: false,
      status: tokenStatus,
    },
  });
  syncTokenStateToDom();

  return tokenStatus;
}

export async function syncTokenStateToDom() {
  const { sendToDom } = domCommunicationStore.get();
  const { isRefreshing, status } = authStore.get().tokenState ?? {};
  sendToDom?.({
    action: 'SET_TOKEN_STATE',
    payload: {
      isRefreshing: isRefreshing ?? false,
      status,
    },
  }).catch(() => {});
}
