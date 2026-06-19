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

function getAuthToken() {
  const state = useAuthStore.getState();
  return state.accessToken || state.token;
}

// ===================== REFRESH TOKEN LOGIC =====================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

function getRefreshToken(): string | null {
  const state = useAuthStore.getState();
  return state.user.refreshToken || '';
}

function setTokens(accessToken: string, refreshToken?: string): void {
  const state = useAuthStore.getState();
  state.setAccessToken(accessToken);
  state.setToken(accessToken);

  const user = useAuthStore.getState().user;
  user.refreshToken = refreshToken;
  state.setUser(user);
}

async function refreshAccessToken(): Promise<string> {
  debugger
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const baseUrl = getBaseUrl();
  const exToken = getAuthToken();
  const response = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${exToken}` },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Refresh failed");

  const payload = await response.json();
  const newAccessToken = payload.data.accessToken;
  const newRefreshToken = payload.data.refreshToken;

  setTokens(newAccessToken, newRefreshToken || refreshToken);
  return newAccessToken;
}

async function handle401Response(
  url: string,
  method: string,
  body: BodyInit | undefined,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<ApiResponse> {
  if (!getRefreshToken()) {
    // No refresh token available — throw the error without logging out.
    // The user stays on the page; calling code can handle the 401 as needed.
    throw new Error("Session expired");
  }

  if (isRefreshing) {
    const newToken = await new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
    headers["Authorization"] = `Bearer ${newToken}`;
    return executeFetch(url, method, body, headers, signal);
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);
    isRefreshing = false;

    headers["Authorization"] = `Bearer ${newToken}`;
    return executeFetch(url, method, body, headers, signal);
  } catch (error) {
    processQueue(error, null);
    isRefreshing = false;
    // Do NOT clear auth or redirect on refresh failure.
    // The user stays on the page; the error propagates to the calling code.
    throw new Error("Session expired. Please try again.");
  }
}

async function executeFetch(
  url: string,
  method: string,
  body: BodyInit | undefined,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<ApiResponse> {
  const response = await fetch(`${getBaseUrl()}${url}`, {
    method,
    signal,
    headers,
    body,
    cache: "no-store",
  });

  if (response.status === 401) {
    debugger
    return handle401Response(url, method, body, headers, signal);
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

export async function apiRequest({
  url,
  method = "GET",
  body,
  headers,
  signal,
}: ApiRequestOptions): Promise<ApiResponse<any>> {
  const authToken = getAuthToken();
  const language = getCookie("i18next") || useAuthStore.getState().currentLanguage || "en";

  const fetchHeaders: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": language,
    ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  const fetchBody = body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

  return executeFetch(url, method, fetchBody, fetchHeaders, signal);
}
