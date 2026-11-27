# PG Ease Round 4 Report (`v1.0.13` Owner / `v1.0.11` Tenant)

## 1. Item Summary Table (A–K)

| Item | Status | Root Cause & Fix |
| --- | --- | --- |
| **A (Crash Screens & Gates)** | Done | `MobileTenantsV2.tsx:353` used `LayoutList` without importing it; `Structure.tsx` used `React.Fragment` without importing `React`; `package.json` `"build"` ran `vite build` without `tsc -b`. Fixed all 11 `tsc -b` errors, updated `build` to `tsc -b && vite build`, hid raw error messages in `GlobalErrorBoundary.tsx` in release builds, and added `scripts/verify-routes.mjs` (Owner 93/94 PASS; Tenant 24/24 PASS). |
| **B (My PG Compact Card & Full-Height Sheet)** | Done | Replaced heavy hero + stats cards in `MobileMyPgV2.tsx` with one compact property card (Active chip, copyable ID, Edit PG, phone / "Add phone", 2-line address, 4 stat tiles). Upgraded `BottomSheet` in `Primitives.tsx` with `fullHeight`, `rgba(15,23,32,0.55)` scrim, body scroll lock, sticky header/footer. |
| **C (Structured Address)** | Done | Added `AddressFields.tsx` (`Address Line 1/2`, `City`, `State` dropdown, `6-digit PIN`) with `splitLegacyAddress()`, `composeStructuredAddress()`, PIN conflict banner, and 8 Vitest unit tests (`addressSplit.test.ts`). |
| **D (Tenant Semantic Colors & Rent SwipeTabs)** | Done | Restored semantic amber/green/red/blue/purple/orange palette across 11 Tenant pages from `cbd3a4d`. Upgraded `TransactionHistoryPage.tsx` status tabs to `<SwipeTabs>` with `touch-pan-y` and `overscroll-x-contain`. |
| **E (Owner Menu)** | Done | Updated `MobileMenuV2.tsx` with registered `+91` phone number, 2 credit chips (`KYC`, `KYC+Agr`), plan chip, and `v1.0.13` footer. |
| **F (Pricing ₹29/bed, No Free Trial)** | Frontend Done (Backend Handoff) | Removed free-trial UI/copy from `AppHeader.tsx`, `MobileDashboardV2.tsx`, `MobileMenuV2.tsx`, `Plans.tsx`, `Login.tsx`, `PermissionsMatrixPage.tsx`, `EaseBuddyAI.tsx`, and disabled `FirstLoginTrialModal.tsx`. Backend `pg-ease-nest` changes documented in `BACKEND-ROUND4-HANDOFF.md`. |
| **G (Merge Subscription Plan & Plans & Billing)** | Done | Merged `"Subscription Plans"` / `"Subscription & Plans"` into `"Plans & Billing"` across `ownerNav.ts`, `AppSidebar.tsx`, `navRegistry.ts`, `MobileDashboardV2.tsx`, with `/subscription` and `/subscription-plans` redirects in `App.tsx`. |
| **H (Plans & Billing)** | Updated | Removed trial copy in `Plans.tsx` (responsive layout & invoices). |
| **I (Two Credit Types)** | Done (API-ready) | Added `kycCreditsBalance` & `kycAgreementCreditsBalance` in `propertyOwner.ts` and `usePropertySummary.ts`; rendered two separate tappable chips (`KYC: N`, `KYC+Agr: N`) on `MobileDashboardV2.tsx` and `MobileMenuV2.tsx` (red at `<= 5`). |
| **J (Owner Logo & Phone)** | Done | Added formatted `+91` phone in `AppHeader.tsx` dropdown and `MobileMenuV2.tsx`; `<PgAvatar>` in `MobileHeaders.tsx`. |
| **K (Admin Panel Tenant Highlights)** | Frontend Done | Added `"Tenants not assigned to a PG"` and `"New tenants (last 7 days) in a PG"` clickable KPI cards in `pg-ease-admin/src/pages/DashboardPage.tsx`, and `?assignment=` filter chips + `"Not assigned to PG"` / `"New"` badges + `Signed up` / `Last login` columns in `TenantsPage.tsx`. |

## 2. Verification & Signed APKs

- **Owner (`pg-manager-web-application`)**: `npm run verify:all` (53 inventory / 49 registry, 0 hardcoded hex in 14 mobile TSX files, `tsc -b` 0 errors, `vite build`), `npm test` (9 files, 45/45 tests PASS).
- **Tenant (`tenant-web-app`)**: `npm run verify:all` (16/16 inventory, `tsc -b` 0 errors, `vite build`), `npm run verify:routes` (24/24 PASS).
- **Admin (`pg-ease-admin`)**: `npm run build` passed.
- **Signed Release APKs**:
  - `apks/pgease-owner-v1.0.13.apk` (`in.pgease.owner`, `versionCode=14`, `versionName=1.0.13`)
  - `apks/pgease-tenant-v1.0.11.apk` (`in.pgease.tenant`, `versionCode=12`, `versionName=1.0.11`)
- **Note**: `pg-ease-nest` was not modified per user rule (backend requirements are listed in `BACKEND-ROUND4-HANDOFF.md`). No `git push` was run.
