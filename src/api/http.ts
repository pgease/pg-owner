// Dev calls go through the Vite `/api` proxy. The live API rejects
// http://localhost and http://127.0.0.1 in CORS, which blocks OTP.
const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL ||
    "https://am4eey3lmk.execute-api.ap-south-1.amazonaws.com/api";

/** Spec alias for PermissionContext — same value as access token after login */
export const PGEASE_TOKEN_KEY = "pgease_token";
const ACCESS_TOKEN_KEY = "pgEase_accessToken";
const REFRESH_TOKEN_KEY = "pgEase_refreshToken";
const PROPERTY_OWNER_KEY = "pgEase_propertyOwner";
const SELECTED_PG_ID_KEY = "pgEase_selectedPgId";
const LANGUAGE_KEY = "pgEase_language";

import { decodeJwtPayload, isTokenExpiringSoon } from "../lib/jwt";

function getNativePrefs(): {
  get: (opts: { key: string }) => Promise<{ value: string | null }>;
  set: (opts: { key: string; value: string }) => Promise<void>;
  remove: (opts: { key: string }) => Promise<void>;
} | null {
  if (typeof window === "undefined") return null;
  return (window as any).Capacitor?.Plugins?.Preferences ?? null;
}

let _hydrated = false;
let _hydratePromise: Promise<void> | null = null;

/**
 * Hydrates auth tokens from Capacitor Preferences into localStorage on app boot
 * so sessions survive WebView cache/storage eviction.
 */
export function hydrateAuthStorage(): Promise<void> {
  if (_hydrated) return Promise.resolve();
  if (_hydratePromise) return _hydratePromise;

  _hydratePromise = (async () => {
    try {
      const prefs = getNativePrefs();
      if (!prefs || typeof window === "undefined") return;
      const keys = [ACCESS_TOKEN_KEY, PGEASE_TOKEN_KEY, REFRESH_TOKEN_KEY, PROPERTY_OWNER_KEY, SELECTED_PG_ID_KEY];
      for (const key of keys) {
        if (!window.localStorage.getItem(key)) {
          const res = await prefs.get({ key }).catch(() => ({ value: null }));
          if (res?.value) {
            window.localStorage.setItem(key, res.value);
          }
        }
      }
    } finally {
      _hydrated = true;
    }
  })();

  return _hydratePromise;
}

export function isAuthHydrated(): boolean {
  if (typeof window === "undefined") return true;
  if (!getNativePrefs()) return true;
  return _hydrated;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpError extends Error {
  status?: number;
  data?: unknown;
}

export const authStorage = {
  set(tokens: { accessToken: string; refreshToken: string; propertyOwner?: unknown }) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(PGEASE_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (tokens.propertyOwner) {
      window.localStorage.setItem(PROPERTY_OWNER_KEY, JSON.stringify(tokens.propertyOwner));
    }
    const prefs = getNativePrefs();
    if (prefs) {
      void prefs.set({ key: ACCESS_TOKEN_KEY, value: tokens.accessToken });
      void prefs.set({ key: PGEASE_TOKEN_KEY, value: tokens.accessToken });
      void prefs.set({ key: REFRESH_TOKEN_KEY, value: tokens.refreshToken });
      if (tokens.propertyOwner) {
        void prefs.set({ key: PROPERTY_OWNER_KEY, value: JSON.stringify(tokens.propertyOwner) });
      }
    }
    window.dispatchEvent(new Event("pgease-auth-token-updated"));
  },
  clear() {
    if (typeof window === "undefined") return;
    const authKeys = [
      ACCESS_TOKEN_KEY,
      PGEASE_TOKEN_KEY,
      "pgease_token",
      "pgease_access_token",
      "access_token",
      "pgease_auth_token",
      REFRESH_TOKEN_KEY,
      "pgease_refresh_token",
      "refresh_token",
      PROPERTY_OWNER_KEY,
      "pgease_propertyOwner",
      "pgease_owner",
      "pgease_user",
      SELECTED_PG_ID_KEY,
      "pgease_selectedPgId",
      "trial_expired_gate_dismissed",
    ];
    authKeys.forEach((key) => window.localStorage.removeItem(key));
    const prefs = getNativePrefs();
    if (prefs) {
      authKeys.forEach((key) => void prefs.remove({ key }));
    }
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("pgease-auth-token-updated"));
    window.dispatchEvent(new Event("pgease-owner-updated"));
  },
  getRawAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem(PGEASE_TOKEN_KEY) || window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token || token === "null" || token === "undefined" || !token.trim()) {
      return null;
    }
    return token;
  },
  getAccessToken(): string | null {
    // Persistent login: NEVER wipe tokens here when access token is expired;
    // httpRequest + attemptTokenRefresh will refresh it silently.
    return this.getRawAccessToken();
  },
  isLoggedIn(): boolean {
    return Boolean(this.getRawAccessToken() || this.getRefreshToken());
  },
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setPropertyOwner(owner: unknown) {
    if (typeof window === "undefined") return;
    if (owner) {
      window.localStorage.setItem(PROPERTY_OWNER_KEY, JSON.stringify(owner));
    } else {
      window.localStorage.removeItem(PROPERTY_OWNER_KEY);
    }
    window.dispatchEvent(new Event("pgease-owner-updated"));
  },
  getPropertyOwner(): { id?: string; name?: string; email?: string; mobileContactNumber?: string; [key: string]: unknown } | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PROPERTY_OWNER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  isStaff(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    return (
      Boolean(payload.staffId) ||
      payload.role === "staff" ||
      payload.userType === "staff" ||
      payload.type === "staff"
    );
  },
  isOwner(): boolean {
    return !this.isStaff();
  },
};

export const appPrefs = {
  getSelectedPgId() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(SELECTED_PG_ID_KEY);
  },
  setSelectedPgId(id: string | null) {
    if (typeof window === "undefined") return;
    if (id) window.localStorage.setItem(SELECTED_PG_ID_KEY, id);
    else window.localStorage.removeItem(SELECTED_PG_ID_KEY);
  },
  getLanguage(): "hi-IN" | "en-US" {
    if (typeof window === "undefined") return "en-US";
    const v = window.localStorage.getItem(LANGUAGE_KEY);
    return v === "hi-IN" ? "hi-IN" : "en-US";
  },
  setLanguage(lang: "hi-IN" | "en-US") {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  },
};

/* ─── Token refresh with single-flight dedup ─────────────────────────────── */

type RefreshOutcome = "ok" | "invalid" | "network_error";
let _refreshPromise: Promise<RefreshOutcome> | null = null;

async function doTokenRefresh(): Promise<RefreshOutcome> {
  const rt = authStorage.getRefreshToken();
  if (!rt) return "invalid";
  try {
    const res = await fetch(`${API_BASE_URL}/property-owners/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (res.status === 401 || res.status === 403) {
      return "invalid";
    }
    if (!res.ok) {
      // 5xx, 429, etc. — transient server error, do NOT log user out
      return "network_error";
    }
    const json = await res.json();
    if (!json?.accessToken) return "network_error";
    authStorage.set({
      accessToken: json.accessToken,
      refreshToken: json.refreshToken || rt,
    });
    return "ok";
  } catch {
    return "network_error";
  }
}

export function refreshSessionSingleFlight(): Promise<RefreshOutcome> {
  if (!_refreshPromise) {
    _refreshPromise = doTokenRefresh().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

export function performLogout(reason: "manual" | "revoked" | "deleted" = "manual") {
  const rt = authStorage.getRefreshToken();
  const at = authStorage.getRawAccessToken();
  if (rt || at) {
    try {
      void fetch(`${API_BASE_URL}/property-owners/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(at ? { Authorization: `Bearer ${at}` } : {}),
        },
        body: JSON.stringify({ refreshToken: rt }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // best effort
    }
  }
  authStorage.clear();
  if (typeof window !== "undefined") {
    if (reason === "revoked") {
      try {
        window.sessionStorage.setItem("pgease_session_ended_msg", "Your session ended. Please log in again.");
      } catch {
        // ignore
      }
    }
    window.location.replace("/login");
  }
}

function forceLogout() {
  performLogout("revoked");
}

let _lifecycleInit = false;
export function initPersistentAuthLifecycle() {
  if (_lifecycleInit || typeof window === "undefined") return;
  _lifecycleInit = true;

  const maybeProactiveRefresh = () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const token = authStorage.getRawAccessToken();
    const rt = authStorage.getRefreshToken();
    if (!rt) return;
    if (!token || isTokenExpiringSoon(token, 120)) {
      void refreshSessionSingleFlight();
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") maybeProactiveRefresh();
  });

  const capApp = (window as any).Capacitor?.Plugins?.App;
  if (capApp?.addListener) {
    capApp.addListener("appStateChange", (state: { isActive: boolean }) => {
      if (state.isActive) maybeProactiveRefresh();
    });
  }
}

function formatApiErrorMessage(data: unknown): string {
  if (data != null && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) {
      const parts = m.filter((x): x is string => typeof x === "string");
      if (parts.length) return parts.join(" ");
    }
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Something went wrong";
}

/* ─── HTTP client ─────────────────────────────────────────────────────────── */

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
  _retried?: boolean;
  skipForceLogout?: boolean;
}

export async function httpRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    let token = authStorage.getAccessToken();
    if (token && isTokenExpiringSoon(token, 120) && (typeof navigator === "undefined" || navigator.onLine)) {
      const outcome = await refreshSessionSingleFlight();
      if (outcome === "ok") {
        token = authStorage.getAccessToken();
      }
    }
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const serializedBody =
    options.body instanceof FormData
      ? options.body
      : options.body !== undefined && options.body !== null
        ? JSON.stringify(options.body)
        : undefined;

  // Do not spread `options` into fetch: it carries raw `body` and custom flags (`auth`, `_retried`).
  const { auth: _a, body: _b, _retried: _r, skipForceLogout: _s, headers: _incomingHeaders, ...rest } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: serializedBody,
    });
  } catch (netErr: any) {
    if (!options._retried) {
      // Retry once after 1.5 seconds for transient network errors
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return httpRequest<TResponse>(path, { ...options, _retried: true });
    }
    const error: HttpError = new Error(netErr?.message || "Network request failed");
    error.status = 0;
    throw error;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : undefined;

  if (response.status === 503 && !options._retried) {
    // Retry 503 Service Unavailable once after 1.5s (OW-20)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return httpRequest<TResponse>(path, { ...options, _retried: true });
  }

  if (response.status === 401 && options.auth && !options._retried) {
    if (options.skipForceLogout) {
      const error: HttpError = new Error("Unauthorized");
      error.status = 401;
      error.data = data;
      throw error;
    }
    const outcome = await refreshSessionSingleFlight();
    if (outcome === "ok") {
      return httpRequest<TResponse>(path, { ...options, _retried: true });
    }
    if (outcome === "invalid") {
      forceLogout();
      const error: HttpError = new Error("Session expired. Please log in again.");
      error.status = 401;
      error.data = data;
      throw error;
    }
    const netErr: HttpError = new Error("No internet connection — Check your connection and try again.");
    netErr.status = 0;
    throw netErr;
  }

  if (!response.ok) {
    if (response.status === 403 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pgease-403-error", {
          detail: {
            status: 403,
            data,
            errorCode: (data as any)?.errorCode,
            message: formatApiErrorMessage(data),
          },
        })
      );
    }
    const error: HttpError = new Error(formatApiErrorMessage(data));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as TResponse;
}

