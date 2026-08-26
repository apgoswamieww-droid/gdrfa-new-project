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

async function refreshAccessToken(): Promise<string> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Refresh failed");

  const payload = await response.json();
  const newAccessToken = payload.data.accessToken;

  setAccessToken(newAccessToken);
  return newAccessToken;
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
  const isGet = method === "GET";
  const token = getAccessToken();

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

  const response = await fetch(`${getBaseUrl()}${finalUrl}`, {
    method,
    signal,
    credentials: "include",
    headers: fetchHeaders,
    body: fetchBody,
    cache: "no-store",
  });

  if (response.status === 401 && token) {
    try {
      const newToken = await refreshAccessToken();
      fetchHeaders["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${getBaseUrl()}${finalUrl}`, {
        method, signal, headers: fetchHeaders, body: fetchBody,
        credentials: "include", cache: "no-store",
      });
      const retryPayload = await parseResponse(retryResponse);
      const msg = typeof retryPayload === "object" && retryPayload && "message" in retryPayload
        ? String((retryPayload as { message?: string }).message)
        : "Something went wrong";
      if (!retryResponse.ok) throw new Error(msg);
      if (typeof retryPayload !== "object" || retryPayload === null) throw new Error("Invalid API response");
      const apiPayload = retryPayload;
      if (!apiPayload.status) throw new Error(apiPayload.message || "Something went wrong");
      return apiPayload;
    } catch {
      setAccessToken(null);
      throw new Error("Session expired");
    }
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

export const changeStatusApi = async (model: string, id: number, status: string): Promise<any> => {
  return apiRequest({
    url: `/admin/change-status?model=${model}&id=${id}&status=${status}`,
    method: "GET",
  });
};
