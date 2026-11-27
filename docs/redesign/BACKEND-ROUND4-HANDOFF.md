# Backend Requirements for Round 4 (`pg-ease-nest`)

Per the frontend-only workspace rule, `pg-ease-nest` was not modified. Please share these requirements with the backend developer:

1. **Item F — Single ₹29/bed/month Plan & No Free Trial**:
   - Collapse sellable plans to one admin-configured plan (`pricePerBed = 29`, yearly = `10` months charged for `12` months = 2 months free, `billingBasis = TOTAL_BEDS | OCCUPIED_BEDS`).
   - Remove trial creation on new owner sign-up (`subscriptionState = PLAN_REQUIRED`).
   - Add server-side `SUBSCRIPTION_REQUIRED` (HTTP `402`) guard for `PLAN_REQUIRED`/expired owners on owner endpoints (excluding auth, profile, plans/billing, payments, invoices, support, account deletion, notifications read).
   - Additive migration for legacy trial owners (`legacyTrial = true`, `legacyTrialEndsAt`, admin `legacyTrialMode = HONOUR_UNTIL_END | LOCK_NOW | EXTEND_TO_DATE`).
   - Admin-configurable feature gating matrix (`hasFeature(key)`), seeded to preserve existing owner entitlements.
   - Disable trial reminder/expiry crons & notifications (do not edit approved Meta WhatsApp templates).

2. **Item I — Two Separate Credit Balances**:
   - Return `kycCreditsBalance` and `kycAgreementCreditsBalance` in `GET /property-owners/credits/balance` (additive fields alongside `remainingCredits`).

3. **Item K — Admin Tenant Highlights**:
   - Add `GET /admin/tenants/highlights` (unassigned count + new assigned in last 7 days count) and `assignment=unassigned|new_assigned|assigned|all` filter on `GET /admin/tenants`, plus nullable `lastLoginAt` column updated on tenant login with indexes on `createdAt` and `lastLoginAt`.
