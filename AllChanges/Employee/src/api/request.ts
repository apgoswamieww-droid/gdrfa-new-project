import { useAuthStore } from "../store/store";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiRequestOptions = {
  url: string;
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiResponse<T = unknown> = {
  status: boolean;
  message: string;
  data: T;
};

const DEFAULT_BASE_URL = "https://localhost:3000/api";

function getBaseUrl() {
  return (import.meta.env.VITE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return undefined;
  return parts.pop()?.split(";").shift();
}

let inMemoryAccessToken: string | null = null;

// Shared promise that resolves when the initial token refresh completes.
// Components can await this before checking authentication state,
// avoiding fragile setTimeout-based workarounds.
let _sessionResolve: () => void;
export const sessionReady: Promise<void> = new Promise((resolve) => {
  _sessionResolve = resolve;
});

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

// Single-flight refresh lock.
// When the access token expires and several authenticated requests return 401 at
// (nearly) the same time, they would each POST /auth/refresh-token independently.
// Because the backend rotates the refresh token on every successful refresh, the
// first call consumes the current refresh token and the parallel calls fail with
// the now-invalidated old token, clearing the session and logging the user out.
// Sharing a single in-flight refresh promise ensures concurrent 401s reuse the
// same refresh call and all pickup the freshly rotated token.
let refreshInFlight: Promise<string> | null = null;

function doRefreshAccessToken(): Promise<string> {
  const baseUrl = getBaseUrl();
  return fetch(`${baseUrl}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) throw new Error("Refresh failed");

    const payload = await response.json();
    const newAccessToken = payload.data.accessToken;

    setAccessToken(newAccessToken);
    return newAccessToken;
  });
}

async function refreshAccessToken(): Promise<string> {
  // Reuse the in-flight refresh if one is already running (single-flight).
  if (refreshInFlight) return refreshInFlight;

  const promise = doRefreshAccessToken();
  refreshInFlight = promise;
  try {
    return await promise;
  } finally {
    // Only clear the lock if this is still the same (outermost) refresh attempt.
    if (refreshInFlight === promise) {
      refreshInFlight = null;
    }
  }
}

export async function attemptTokenRefreshOnLoad(): Promise<void> {
  if (inMemoryAccessToken) {
    _sessionResolve();
    return;
  }
  try {
    await refreshAccessToken();
  } catch {
    setAccessToken(null);
  } finally {
    _sessionResolve();
  }
}

export async function apiRequest({
  url,
  method = "GET",
  body,
  headers,
  signal,
}: ApiRequestOptions): Promise<ApiResponse<any>> {
  const language = getCookie("i18next") || useAuthStore.getState().currentLanguage || "en";
  const token = getAccessToken();

  const fetchHeaders: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": language,
    ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const fetchBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  const response = await fetch(`${getBaseUrl()}${url}`, {
    method,
    signal,
    headers: fetchHeaders,
    body: fetchBody,
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401 && token) {
    try {
      const newToken = await refreshAccessToken();
      fetchHeaders["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${getBaseUrl()}${url}`, {
        method,
        signal,
        headers: fetchHeaders,
        body: fetchBody,
        credentials: "include",
        cache: "no-store",
      });
      const retryPayload = await parseResponse(retryResponse);
      if (!retryResponse.ok) {
        const msg = typeof retryPayload === "object" && retryPayload && "message" in retryPayload
          ? String((retryPayload as { message?: string }).message)
          : "Something went wrong";
        throw new Error(msg);
      }
      if (typeof retryPayload !== "object" || retryPayload === null) throw new Error("Invalid API response");
      const apiPayload = retryPayload as ApiResponse;
      if (!apiPayload.status) throw new Error(apiPayload.message || "Something went wrong");
      return apiPayload;
    } catch {
      setAccessToken(null);
      throw new Error("Session expired");
    }
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message)
        : "Something went wrong";
    throw new Error(message);
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid API response");
  }

  const apiPayload = payload as ApiResponse;

  if (!apiPayload.status) {
    throw new Error(apiPayload.message || "Something went wrong");
  }

  return apiPayload;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}
