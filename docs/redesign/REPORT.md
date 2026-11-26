# PG Ease Owner App — Figma Redesign, Persistent Login & Offline Experience Report

## 1. Phase Summary

| Phase | Status | Notes |
|---|---|---|
| **0. Inventory & Baseline** | Done | 53 inventory items mapped to 49 `navRegistry.ts` entries (`npm run verify:inventory` passes); 29 BEFORE screenshots captured at 360x800 in `docs/redesign/before/`. |
| **1. Foundations** | Done | Tokens (`src/mobile/tokens.ts`, `src/styles/mobile-shell.css`), local Poppins, `formatINR`/`formatCount` + Vitest tests, `usePropertySummary` + Vitest tests, shared components + `/__gallery` dev page. |
| **B. Persistent Login** | Done (Frontend) / Spec Ready (Backend) | Fixed client root causes in both Owner & Tenant web/mobile apps (Preferences hydration, single-flight refresh, offline-safe 401 handling, proactive refresh). Backend spec documented in Section 7 for `pg-ease-nest` (untouched per frontend-only rule). |
| **C. Offline Experience & Mascot** | Done | Placed Ease Buddy mascot assets (`512`/`256` WebP + `1024` PNG docs), `offline.html` + Poppins fonts, PWA Service Workers (`public/sw.js`), `@capacitor/network` `OfflineBanner`, `server.errorPath: "offline.html"`. |
| **4 & 5. Figma 5-Tab Shell & Migrations** | Done | Implemented `MobileDashboardV2`, `MobileMyPgV2`, `MobileTenantsV2`, `MobileRentV2`, `MobileMenuV2`, unified `MobileAppHeader` / `MobileSubHeader` / `MobileBottomNavV2`, Android back handler, dark mode tokens, `Splash Screen (Test)` gated out of prod. |
| **6. Verification & Release Builds** | Done | AFTER screenshots captured at 360x800, `npm test` (37/37), `npm run verify:inventory` (53/53), Owner APK v1.0.10 (vc11) and Tenant APK v1.0.8 (vc9) built & signed with external keystore. |

---

## 2. Key Architectural Findings & Root Causes

1. **WebView Loading Mode (`capacitor.config.json`)**:
   - Both `pg-owner-mobile-app` (`in.pgease.owner`) and `pg-tenant-mobile-app` (`in.pgease.tenant`) use **bundled `webDir: "dist"`** (NOT remote `server.url`). Cold starts load instantly from local assets even with zero network. `server.errorPath: "offline.html"` is configured as fallback.
2. **Root Cause of `₹50016.9k` Bug**:
   - A naive `/ 1000` + lowercase `k` suffix was applied without Indian grouping (`L`/`Cr`) or decimal clamping. Replaced across the mobile shell with `formatINR(amount, { compact })` using `Intl.NumberFormat('en-IN')` (e.g. `₹5.0L`, `₹50K`, `₹5,00,169`).
3. **Root Cause of Count Mismatches (`0 tenants` vs `11`, `27` vs `21` beds)**:
   - Dashboard, Property Details, and Tenants tab previously computed counts from separate hooks/endpoints with divergent filters. Unified under `usePropertySummary(propertyId)` which enforces `occupiedBeds + vacantBeds === totalBeds` and `totalTenants === tenants.length` from a single query source. Failed tenant fetches now render `MascotErrorState` with Retry instead of `"No tenants yet"`.
4. **Root Cause of Unexpected Logouts (Phase B)**:
   - **Owner Web (`src/api/http.ts`)**: `authStorage.getAccessToken()` called `this.clear()` (wiping `refreshToken` too!) whenever the `15m` access token expired. Also `attemptTokenRefresh()` returned `false` on network errors, triggering `forceLogout()`.
   - **Tenant Web (`src/services/apiClient.ts`)**: Response interceptor called `handleUnauthorizedRedirect()` in `catch (refreshErr)` even on offline/network errors or 5xx responses.
   - **Backend (`pg-ease-nest`)**: Access tokens expire in `15m` (`1h` staff) and refresh tokens in `7d` with immediate revocation and no grace window.

---

## 3. Figma-Only Items: Decision + Reason (Section 5.9)

| Figma Item | Decision | Reason |
|---|---|---|
| **Gold Host** chip | Hidden | Backend has no host-tier/badge field; per rule, never show unverified badges. |
| **PG Verified Tick** | Conditional | Shown ONLY when `selectedPg.isVerified` is true in backend data. |
| **New Updates** dummy cards | Hidden | Hardcoded `"Digital Agreements Now Live"` & `"Rate & Review Feature"` removed until backed by live announcements. |
| **Splash Screen (Test)** | Dev-only | Gated with `import.meta.env.DEV`; absent in release APK. |
| **Rental Agreements** | Mapped to `/tenants/kyc` | Mapped to existing KYC & Agreements module (`Kyc.tsx`). |
| **Gate Requests** | Mapped to `/nightout` & `/tenants/guests` | Mapped to existing Night Out & Guest Requests pages. |
| **Dining Schedule** | Mapped to `/food` | Mapped to existing `FoodDiningPage.tsx`. |
| **Activity Audit Trail** | Mapped to `/activity-logs` | Mapped to existing `ActivityLogsPage.tsx`. |
| **Refer & Earn** | Mapped to `/referrals` | Uses existing `ReferralsPage.tsx` without inventing unbacked reward promises. |

---

## 4. Brand Colour Cleanups (Section 3)

- Removed yellow/amber/purple/orange chrome across the mobile shell (`MobileDashboardV2`, `MobileMyPgV2`, `MobileRentV2`, `MobileMenuV2`, `StatusChip`, `MobileBottomNavV2`):
  - `"KYC Pending"` / pending states use `--ms-brand-50` (`#E6F3F3`) with `--ms-brand-800` (`#005F5F`) text & border (no amber).
  - Menu `"Manage"` plan button uses white pill with `#005F5F` text (no yellow).
  - `"Send Reminders"`, `"Announcement"`, `"Wi-Fi Information"`, `"Food Menu"` icon tiles use `--ms-brand-50` + `--ms-brand-text` (`#008080`).
  - Red (`#DC2626`) reserved strictly for Complaints, Open Tickets, Rent Due, Delete Account, and Logout.

---

## 5. Shared Components Created

- `src/mobile/tokens.ts` & `src/styles/mobile-shell.css`
- `src/mobile/utils/formatters.ts` (`formatINR`, `formatCount`)
- `src/mobile/hooks/usePropertySummary.ts` & `src/mobile/hooks/useNetworkStatus.ts`
- `src/mobile/navRegistry.ts` & `scripts/verify-inventory.mjs`
- `src/mobile/components/ui/Primitives.tsx` (`MobileCard`, `StatTile`, `SectionHeader`, `ListRow`, `FilterChips`, `SegmentedTabs`, `PrimaryButton`, `OutlineButton`, `DangerButton`, `ExtendedFAB`, `BottomSheet`, `ConfirmDialog`, `SkeletonBlock`, `OccupancyRing`, `Avatar`, `StatusChip`, `MoneyText`)
- `src/mobile/components/ui/MascotStates.tsx` (`MascotEmptyState`, `MascotErrorState`, `OfflineBanner`)
- `src/mobile/components/ui/MobileHeaders.tsx` (`MobileAppHeader`, `MobileSubHeader`)
- `src/mobile/components/ui/MobileBottomNavV2.tsx` & `PageScaffold.tsx`

---

## 6. Inventory Verification

- `npm run verify:inventory`: **53 inventory rows verified against 49 `navRegistry.ts` entries (0 missing)**.
- `npm test`: **8 test files, 37 tests passed** (including `formatters.test.ts` and `usePropertySummary.test.ts`).
- Screenshots saved in `docs/redesign/before/` (29 files) and `docs/redesign/after/` (11 files).

---

## 7. Backend Requirements Specification (`pg-ease-nest` — For Backend Developer)

Per workspace rules, `pg-ease-nest` was inspected read-only and not modified. Share these exact requirements with the backend developer to complete server-side 90-day sliding refresh:

1. **Refresh Token Expiry & Sliding Rotation**:
   - Extend `refreshToken` JWT expiry & session `expiresAt` from `7d` to **`90d`** (sliding: every `POST /property-owners/refresh-token` and `POST /tenants/refresh-token` issues a new 90-day refresh token and extends `expiresAt` by 90 days).
   - Keep `accessToken` at `15m`–`30m` (`1h` for staff).
2. **Grace Window & Reuse Detection**:
   - Store a hash of `refreshToken` per device/session (`property_owner_sessions`, `tenant_sessions`, `staff_sessions`) with `replacedBy` and `revokedAt`.
   - Allow a **30–60s grace window** for the immediately-previous refresh token so concurrent requests on flaky networks do not revoke the session.
   - If an older already-rotated token is reused outside the grace window, revoke that session family.
3. **Structured Auth Error Codes**:
   - Return `errorCode: "TOKEN_EXPIRED"` when access token is expired, and `errorCode: "REFRESH_INVALID"` or `"SESSION_REVOKED"` when the refresh token is invalid/revoked.
4. **Multi-Device & Logout**:
   - Allow at least 5 active sessions per user; add `POST /property-owners/logout` and `POST /tenants/logout` to revoke the current session (and revoke all on account deletion).

---

## 8. Builds & Git Status

- **NO push, NO deploy, keystore untouched, zero secrets printed.**
- Owner branch: `feat/owner-figma-redesign` (`pg-manager-web-application`, `pg-owner-mobile-app`) -> `versionCode 11`, `versionName "1.0.10"`.
- Tenant branch: `feat/persistent-login-offline` (`tenant-web-app`, `pg-tenant-mobile-app`) -> `versionCode 9`, `versionName "1.0.8"`.
