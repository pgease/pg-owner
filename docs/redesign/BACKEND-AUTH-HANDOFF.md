# Backend Auth Handoff — 90-Day Persistent Login (`pg-ease-nest`)

> **Status**: Client apps (Owner Web, Owner APK, Tenant Web, Tenant APK) are 100% ready for 90-day sliding persistent login. `pg-ease-nest` was **not modified**; it currently issues 15m access tokens and 7d refresh tokens with immediate revocation.

## 1. Current Observed Lifetimes (`pg-ease-nest`)
- **Property Owner**: `accessToken` = `15m`, `refreshToken` = `7d` (`property_owner_sessions`).
- **Tenant**: `accessToken` = `15m`, `refreshToken` = `7d` (`tenant_sessions`, immediately sets `revoked = true` on refresh with no grace window).
- **Staff**: `accessToken` = `1h`, `refreshToken` = `7d` (`staff_sessions`).

## 2. Required Backend Changes
1. **Token Lifetimes**:
   - Keep `accessToken` at `15m`–`30m` (`1h` for staff).
   - Extend `refreshToken` JWT expiry and DB `expiresAt` to **`90d`** (sliding: every successful refresh issues a new 90-day `refreshToken` and extends `expiresAt` by 90 days).
2. **Refresh Token Rotation + Grace Window**:
   - Store a SHA-256 hash of `refreshToken` per device/session (`id`, `userId`, `role`, `deviceId`, `deviceName`, `tokenHash`, `createdAt`, `lastUsedAt`, `expiresAt`, `revokedAt`, `replacedBy`).
   - Allow a **30–60s grace window** for the immediately-previous `refreshToken` so concurrent requests on flaky networks do not revoke the session.
   - If an older already-rotated token is reused outside the grace window, revoke that session family.
3. **Structured Error Codes (`401`)**:
   - Return `errorCode: "TOKEN_EXPIRED"` when the access token is expired.
   - Return `errorCode: "REFRESH_INVALID"` or `"SESSION_REVOKED"` when the refresh token is invalid/expired/revoked.
4. **Endpoints & Multi-Device**:
   - `POST /property-owners/refresh-token` & `POST /tenants/refresh-token`: `{ refreshToken }` -> `{ accessToken, refreshToken }`.
   - `POST /property-owners/logout` & `POST /tenants/logout`: `{ refreshToken? }` -> revokes current session.
   - Allow >= 5 concurrent device sessions per user; revoke all sessions on account deletion.

## 3. Backend Test Checklist
- [ ] Refresh issues new 90-day `refreshToken` and extends `expiresAt` by 90 days.
- [ ] Concurrent refresh with previous token within 30–60s grace window succeeds.
- [ ] Reuse of older rotated token outside grace window revokes the session family and returns `SESSION_REVOKED`.
- [ ] Explicit logout revokes only the current device session; other devices stay logged in.
- [ ] Account deletion revokes all active sessions.
