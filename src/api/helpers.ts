import { router } from "expo-router";
import { API_FIELDS, BACKEND_URL } from "../constants";
import { Cookies } from "../constants/CookieMock";
import { refreshAccessTokens } from "./token";

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

  if (useTagsOnly) {
    defaultHeaders["X-UseTagsOnly"] = "true";
  }

  const fetchOptions: RequestInit = {
    method,
    headers: { ...defaultHeaders, ...headers },
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
    const response = await fetch(`${BACKEND_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw formatApiError(errorData, response);
    }

    return (await response.json()) as T;
  } catch (error) {
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

    console.error(`API Fetch Error (${endpoint}):`, error);
    throw error;
  }
}
