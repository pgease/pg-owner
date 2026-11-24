# PG Ease – Owner Mobile App Parity Map

This document maps every module in the PG Ease Owner platform from the Web Application (Source of Truth) to the Mobile Application (Capacitor Native iOS & Android wrapper).

---

## Architecture & Ground Truth

- **Web Application Source**: `pg-manager-web-application` (React 18 + Vite + Tailwind CSS + Lucide Icons + TanStack Query)
- **Mobile Wrapper**: `pg-owner-mobile-app` (Capacitor 6 Android & iOS native container, building from `pg-manager-web-application/dist`)
- **Backend API**: `pg-ease-nest` (NestJS REST API on AWS Serverless / Lambda)

---

## Screen & Feature Parity Mapping

### 1. Dashboard (Overview)
- **Route**: `/dashboard`
- **Subtitle**: `Overview for {Month Year}`
- **Components**:
  - `MobileDashboard.tsx`: Comprehensive mobile dashboard
  - `MonthlyKpiDashboard.tsx`: Month-wise KPIs, Revenue vs Expected, Collection Rate %, Occupancy %, KYC status, Notice count
  - `PendingRentCard.tsx`: Pending rent quick list, direct WhatsApp reminder (`sendWhatsAppRentReminder`), record payment
  - `RoomGrid.tsx`: Bed tiles by room (occupied with tenant name, vacant with `+ Allocate`)
  - `OwnerSupportCommunityCards.tsx`: Community, Video Tutorials, Dedicated Manager
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/dashboard`
  - `GET /api/property-owners/properties/:id/kpis/monthly?month=:m&year=:y`
  - `GET /api/property-owners/properties/:id/rooms`
  - `GET /api/property-owners/properties/:id/tenants`
  - `GET /api/property-owners/notifications/unread-count`
- **Actions**:
  - Month switcher (select past or current month)
  - Refresh button with spin indicator
  - Add Resident / Direct Bed Allocate
  - Quick Record Payment
  - Direct WhatsApp Rent Reminder
  - Notification bell (navigate to `/notifications` and link to `/notifications/preferences`)
- **States**: Skeleton loading for metric cards, empty state if no properties, error state with Retry.

---

### 2. Property -> PG Details / Active Property
- **Route**: `/my-pgs`
- **Header**: `Active Property`
- **Subtitle**: `Manage primary information and access property modules for {PG name}`
- **Components**: `MyPGs.tsx`, `PropertySwitcher`, `PropertyEditDrawer.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties`
  - `PUT /api/property-owners/properties/:id`
- **Fields**: Property Name, Code, Address, City, Locality, Pincode, Google Maps Pin URL, Mobile Contact Number, Emergency Number, Warden Contact, Total Floors, Bank Account, Photos.
- **Entry Points**: Rooms & Beds (`/my-pgs/structure`), Facilities (`/my-pgs/amenities`), Restrictions (`/my-pgs/restrictions`), WiFi (`/my-pgs/wifi`), Notice Board (`/my-pgs/notices`), Bank Accounts (`/my-pgs/bank`), Public Listing (`/post-pg`).

---

### 3. Rooms & Beds
- **Route**: `/my-pgs/structure`
- **Subtitle**: `Manage property blocks, floors, rooms, and bed occupancy with direct tenant check-in.`
- **Components**: `Structure.tsx`, `AddRoomDialog.tsx`, `BedTile.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/rooms`
  - `POST /api/property-owners/properties/:id/blocks`
  - `POST /api/property-owners/properties/:id/floors`
  - `POST /api/property-owners/properties/:id/rooms`
  - `DELETE /api/property-owners/properties/:id/rooms/:roomId`
- **Fields**: Block Name, Floor Name/Number, Room Number, Bed Capacity (1 to 6 sharing), Monthly Rent, Security Deposit, Room Type (AC / Non-AC, Attached Washroom, Balcony).
- **Actions**: Add Block/Floor/Room, Delete Room, `+ Allocate` on vacant bed (opens `/tenants/add` with pre-filled room and bed).
- **Bug Fix**: Floor string mapping resolved to prevent "Floor not set".

---

### 4. WiFi Management
- **Route**: `/my-pgs/wifi`
- **Subtitle**: `Network name and password for {PG name}, by block and floor.`
- **Components**: `WifiManagementPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/wifi`
  - `PUT /api/property-owners/properties/:id/wifi`
- **Fields**: SSID (Network Name), Password, Scope (Property-wide, Block-level, Floor-level).
- **Actions**: Add/Edit/Delete WiFi credentials, Show/Hide password toggle, Copy SSID, Copy Password.

---

### 5. Notice Board
- **Route**: `/my-pgs/notices`
- **Subtitle**: `Broadcast announcements and updates for {PG name}.`
- **Components**: `PropertyNoticesPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/notices`
  - `POST /api/property-owners/properties/:id/notices`
  - `DELETE /api/property-owners/properties/:id/notices/:noticeId`
- **Fields**: Title, Message content, Target Audience (`ALL_TENANTS`, `BLOCK`, `FLOOR`, `ROOM`), Expiry Date (`dd/mm/yyyy`), `sendOnWhatsApp` (boolean).
- **Actions**: Create Notice, Delete Notice, Push WhatsApp Broadcast.

---

### 6. Bank Accounts & Online Collection
- **Route**: `/my-pgs/bank`
- **Subtitle**: `Accounts for {PG name}. Online collection is set up below.`
- **Components**: `PaymentKycPage.tsx`, `AddBankAccountModal.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/bank-accounts`
  - `POST /api/property-owners/bank-accounts`
  - `PUT /api/property-owners/properties/:id/default-bank-account`
  - `GET /api/property-owners/payment-gateway/status`
- **Fields**: Account Holder Name, Bank Account Number, Confirm Account Number, IFSC Code, UPI ID (VPA), Account Type, Primary Toggle.
- **Actions**: Add Account, Verify IFSC, Set Primary Settlement Account, View Gateway Onboarding Status.

---

### 7. Public Listing
- **Route**: `/post-pg`
- **Subtitle**: `Photos, rent, food, map pin, and the phone number people see when they search.`
- **Components**: `PublicListingPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/public-listing`
  - `PUT /api/property-owners/properties/:id/public-listing`
- **Fields**: Photos list, Room Sharing Prices (Single, Double, Triple, 4-Sharing with/without food), Food details, Amenities, House Rules, Nearby Landmarks, Map Pin URL, Public Contact Phone.
- **Actions**: Upload/reorder/delete photos, edit rent matrix, sync to base property record, live preview link.

---

### 8. Tenants – List Screen
- **Route**: `/tenants`
- **Summary**: `{n} residents · {n} rent due · {n} KYC verified · {n} on notice`
- **Components**: `Tenants.tsx`, `MobileTenantsList.tsx`, `MoveTenantModal.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/tenants`
  - `POST /api/property-owners/properties/:id/tenants/transfer`
- **Actions**: Search by name/phone/room, Filter by Block/Floor/Room/KYC/Status, View Mode toggle (Normal / Compact), Export CSV, Move Tenant.

---

### 9. Tenants – Detail Screen
- **Route**: `/tenants/:id`
- **Components**: `TenantDetailPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/tenants/:tenantId`
  - `POST /api/property-owners/tenants/:tenantId/reminders`
  - `POST /api/property-owners/tenants/:tenantId/payments`
  - `POST /api/property-owners/tenants/:tenantId/notice`
  - `POST /api/property-owners/tenants/:tenantId/move-out`
- **Sections**: Status Chips (`Occupied`, `KYC Pending`, `Active`, `Under Notice`), Joined & Room info, Send Reminder (Rent, KYC, Agreement), Rent & Payments history, Add Payment / Discount dialog, Documents & Aadhaar KYC, Digital Rental Agreement, Notice & Move-Out.

---

### 10. Notice Period & Checkout
- **Route**: `/tenants/notice-period`
- **Subtitle**: `Who has given notice at {PG name}, and when the bed frees.`
- **Components**: `NoticePeriodPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/tenants?status=under_notice`
  - `POST /api/property-owners/tenants/:tenantId/notice`
  - `POST /api/property-owners/tenants/:tenantId/extend-notice`
  - `POST /api/property-owners/tenants/:tenantId/cancel-notice`
  - `POST /api/property-owners/tenants/:tenantId/move-out`
- **Actions**: Extend Notice Date, Cancel Notice, Direct Move-Out with full deposit checkout settlement. Responsive button layout on 360px mobile view.

---

### 11. Theme (Dark / Light Mode)
- **Component**: `ThemeToggle.tsx`, `useTheme` hook
- **Actions**: Toggle Light / Dark mode, persist in `localStorage` under `pgease_theme`, applies `.dark` class to `html`.

---

### 12. PG Owner Profile
- **Route**: `/settings/profile`
- **Components**: `OwnerProfileSection.tsx`, `SettingsPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/profile`
  - `PUT /api/property-owners/profile`
- **Fields**: Name, Phone Number, Email, Business / Agency Name, Address, Avatar / Logo upload.

---

### 13. Help & Tutorials
- **Route**: `/help` or Help Modal from Mobile Menu
- **Components**: `MobileBottomNav.tsx`, `TutorialModal.tsx`
- **Content**: YouTube step-by-step video tutorials (Tenant onboarding, Rent collection, Property setup, Aadhaar KYC, Staff roles, Expenses, Public listing).
- **Direct Help**: `Need help? WhatsApp or call +91 77019 53356` with direct Call and WhatsApp deep links.

---

### 14. Notifications & Preferences
- **Route**: `/notifications`, `/notifications/preferences`
- **Components**: `NotificationsPage.tsx`, `NotificationPreferencesPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/notifications`
  - `PUT /api/property-owners/notifications/:id/read`
  - `GET /api/property-owners/notification-preferences`
  - `PUT /api/property-owners/notification-preferences`
- **Preferences**: WhatsApp alerts for rent payments, KYC verifications, guest requests, night out intimations, vacate notices.

---

### 15. Rent & Payments
- **Route**: `/rent-payments`
- **Subtitle**: `Rent register, verification queue and payment ledger for {Month Year}`
- **Components**: `RentPayments.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/rent-collection/dashboard`
  - `GET /api/property-owners/payment-verifications`
  - `POST /api/property-owners/payment-verifications/:txnId/approve`
  - `POST /api/property-owners/payment-verifications/:txnId/reject`
- **Actions**: Month selector, Status tabs (`All`, `Paid`, `Partially Paid`, `Pending`, `Overdue`, `Verification Queue`), Normal / Compact / Export controls, Tenant click opens `/tenants/:id`, Approve / Reject proof with optional reason.

---

### 16. Payment History Ledger
- **Route**: `/rent-payments/history`
- **Subtitle**: `Complete historical audit log of all rent and dues transactions collected for {PG name}.`
- **Components**: `RentPayments.tsx` (History tab)
- **Filters**: Start Date & End Date (`dd/mm/yyyy` pickers), Payment Method, Status, Export CSV.

---

### 17. Dues & Pending Rent
- **Route**: `/rent-payments/dues`
- **Subtitle**: `Dedicated ledger of unpaid, overdue, and pending rent collections for {Month Year}.`
- **Actions**: Filter tabs (`All Unpaid Dues`, `Pending`, `Overdue`, `Partially Paid`), Send WhatsApp Rent Reminder, Record Payment.

---

### 18. Expenses
- **Route**: `/expenses`
- **Subtitle**: `Keep a simple operational register of PG running costs — staff salaries, utility bills, groceries, and repairs.`
- **Components**: `Expenses.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/expenses`
  - `POST /api/property-owners/properties/:id/expenses`
  - `DELETE /api/property-owners/properties/:id/expenses/:id`
- **Fields**: Category, Amount (₹), Date (`dd/mm/yyyy`), Description, Bill Receipt attachment.

---

### 19. Complaints
- **Route**: `/complaints`
- **Subtitle**: `Issues raised by tenants at {PG name}.`
- **Components**: `Complaints.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/complaints`
  - `PATCH /api/property-owners/complaints/:id/status`
- **Fields**: Complaint title, description, category, photos, status (`OPEN`, `IN_PROGRESS`, `RESOLVED`), staff assigned.

---

### 20. Food & Meals
- **Route**: `/food`
- **Subtitle**: `Weekly menus and meal times for {PG name}.`
- **Components**: `FoodMenuPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/food-menu`
  - `PUT /api/property-owners/properties/:id/food-menu`
- **Fields**: Day of week (Monday to Sunday), Meal slots (Breakfast, Lunch, Snacks, Dinner), Meal timings.

---

### 21. Night Out Movement Register
- **Route**: `/nightout`
- **Subtitle**: `Resident night out departure and movement register for {PG name}.`
- **Components**: `NightOutRequestsPage.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/properties/:id/night-out-requests`
  - `PATCH /api/property-owners/night-out-requests/:id/action`
- **Summary Cards**: Total Intimations, Currently Out Tonight, Returned / Completed.
- **Actions**: Approve/Acknowledge, Reject with reason, Mark Returned.

---

### 22. Team & Staff Management
- **Route**: `/team`
- **Subtitle**: `Manage property team members, roles, and administrative access privileges.`
- **Components**: `TeamIndex.tsx`, `AddStaff.tsx`
- **API Endpoints**:
  - `GET /api/property-owners/staff`
  - `POST /api/property-owners/staff/invite`
  - `DELETE /api/property-owners/staff/:id`
- **Fields**: Staff Name, Mobile, Role (Manager, Warden, Accountant, Custom), Property permissions.

---

### 23. Permissions – Staff Roles & Plan Access
- **Route**: `/team/permissions-matrix`
- **Subtitle**: `Clear, simple guide to what each staff member can see, what is hidden, and what features your plan includes.`
- **Components**: `PermissionsMatrixPage.tsx`

---

### 24. Reports & Exports
- **Route**: `/reports`
- **Subtitle**: `Download 95-column tenant records, billing sheets, and KYC audit registers for {PG name}.`
- **Components**: `Reports.tsx`
- **Available Reports**: Full Tenant Ledger, Rent Collection Sheet, KYC Compliance Audit, Room Occupancy & Vacancy, Expense Summary.

---

### 25. Activity Log & Operations Timeline
- **Route**: `/activity-logs`
- **Subtitle**: `Clear, real-time record of rent entries, tenant check-ins, complaints, and changes made across your properties.`
- **Components**: `ActivityLogsPage.tsx`
- **Filters**: Property, Event Type (Payment, Check-in, Move-out, Notice, Complaint), Date (`dd/mm/yyyy`).
