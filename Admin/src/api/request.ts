type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

type ApiRequestOptions = {
  url: string;
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};
const DEFAULT_BASE_URL = "https://localhost:3000";

function getBaseUrl() {
  return (import.meta.env.VITE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getStoredToken() {
  return localStorage.getItem("adminToken");
}

// ===================== REFRESH TOKEN LOGIC =====================

const REFRESH_TOKEN_KEY = "adminRefreshToken";

let inMemoryRefreshToken: string | null = null;

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

function getRefreshTokenFromStorage(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function saveRefreshTokenToStorage(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function getRefreshToken(): string | null {
  // Check in-memory first, then fall back to persisted storage
  if (inMemoryRefreshToken) return inMemoryRefreshToken;

  const stored = getRefreshTokenFromStorage();
  if (stored) {
    inMemoryRefreshToken = stored; // restore to memory
    return stored;
  }

  return null;
}

export function setRefreshToken(token: string): void {
  inMemoryRefreshToken = token;
  // Persist to storage so it survives page refreshes
  saveRefreshTokenToStorage(token);
}


async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const baseUrl = getBaseUrl();
  const accessToken = getStoredToken();

  const response = await fetch(`${baseUrl}/api/admin/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Refresh failed");

  const payload = await response.json();
  const newToken = payload.data.token;
  const newRefreshToken = payload.data.refreshToken;

  localStorage.setItem("adminToken", newToken);
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }

  return newToken;
}

async function handle401Response(
  url: string,
  method: string,
  body: BodyInit | undefined,
  headers: Record<string, string>,
  signal?: AbortSignal
): Promise<any> {
  if (!getRefreshToken()) {
    throw new Error("Session expired");
  }

  if (isRefreshing) {
    const newToken = await new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
    headers["Authorization"] = `Bearer ${newToken}`;
    return executeFetch(url, method, body, headers, signal, true);
  }

  isRefreshing = true;

  try {
    const newToken = await refreshAccessToken();
    processQueue(null, newToken);
    isRefreshing = false;

    headers["Authorization"] = `Bearer ${newToken}`;
    // Retry the original request — if it also gets 401, throw directly
    // (prevents infinite loop when the "refreshed" token is still invalid)
    return executeFetch(url, method, body, headers, signal, true);
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
  signal?: AbortSignal,
  isRetryAfterRefresh = false
): Promise<any> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    signal,
    credentials: "include",
    headers,
    body,
    cache: "no-store",
  });

  if (response.status === 401) {
    // If this request is already a retry after a successful refresh,
    // and it still gets 401, throw directly — no more retries.
    // This prevents an infinite loop when the refreshed token is also invalid.
    if (isRetryAfterRefresh) {
      throw new Error("Session expired. Please try again.");
    }
    return handle401Response(url, method, body, headers, signal);
  }

  const payload = await parseResponse(response);
  const message =
    typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message?: string }).message)
      : "Something went wrong";

  if (!response.ok) {
    throw new Error(message);
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid API response");
  }

  const apiPayload = payload;
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

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}

export async function apiRequest({
  url,
  method = "GET",
  body,
  headers,
  signal,
}: ApiRequestOptions): Promise<any> {
  const token = getStoredToken();
  const isGet = method === "GET";

  let finalUrl = url.startsWith("/api")
    ? url
    : url.startsWith("/admin")
      ? `/api${url}`
      : url;

  let fetchBody: BodyInit | undefined;
  const fetchHeaders: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": localStorage.getItem("adminLanguage") || "en",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  if (body) {
    if (isGet) {
      const qs = buildQueryString(body as Record<string, any>);
      if (qs) {
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
      }
    } else if (body instanceof FormData) {
      fetchBody = body;
    } else {
      fetchBody = JSON.stringify(body);
      fetchHeaders["Content-Type"] = "application/json";
    }
  }

  return executeFetch(finalUrl, method, fetchBody, fetchHeaders, signal);
}

export const changeStatusApi = async (model: string, id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/change-status?model=${model}&id=${id}&status=${status}`,
    method: "GET",
  });
};
