/**
 * Decode JWT payload (middle segment) without verifying signature — client-side only.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "===".slice((payload.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired based on its `exp` claim.
 */
export function isJwtExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    if (typeof payload.exp === "number") {
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a JWT token will expire within `thresholdSeconds` (default 120s = 2 min).
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 120): boolean {
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== "number") return false;
    return Date.now() >= payload.exp * 1000 - thresholdSeconds * 1000;
  } catch {
    return false;
  }
}
