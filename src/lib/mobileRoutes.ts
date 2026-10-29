export const MOBILE_TAB_HIDDEN_PATHS = ["/tenants/add", "/team/add-staff"];

export function shouldHideMobileTabBar(pathname: string): boolean {
  return MOBILE_TAB_HIDDEN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isMobileTabRoot(pathname: string): boolean {
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/kpis") return true;
  if (pathname === "/tenants") return true;
  if (pathname === "/rent-payments") return true;
  if (pathname === "/my-pgs") return true;
  return false;
}

export function getParentRoute(pathname: string): string {
  if (pathname.startsWith("/tenants/")) return "/tenants";
  if (pathname.startsWith("/rent-payments/")) return "/rent-payments";
  if (pathname.startsWith("/my-pgs/")) return "/my-pgs";
  if (pathname.startsWith("/post-pg") || pathname.startsWith("/public-listing") || pathname === "/bank") return "/my-pgs";
  if (pathname.startsWith("/team/")) return "/team";
  if (pathname.startsWith("/settings")) return "/settings";
  return "/dashboard";
}

const TITLE_RULES: { test: (path: string) => boolean; title: string }[] = [
  { test: (p) => p === "/notifications", title: "Notifications" },
  { test: (p) => p === "/dashboard" || p === "/kpis" || p === "/", title: "Home" },
  { test: (p) => p === "/tenants/add", title: "Add tenant" },
  { test: (p) => p === "/tenants/kyc", title: "KYC" },
  { test: (p) => p.startsWith("/tenants/notice"), title: "Notice period" },
  { test: (p) => p.startsWith("/tenants/guests"), title: "Guests" },
  { test: (p) => p.startsWith("/tenants/") && p !== "/tenants", title: "Tenant" },
  { test: (p) => p === "/tenants" || p.startsWith("/leads"), title: "Tenants" },
  { test: (p) => p.startsWith("/rent-payments"), title: "Rent" },
  { test: (p) => p.startsWith("/my-pgs/structure") || p.startsWith("/my-pgs/rooms"), title: "Rooms & Beds" },
  { test: (p) => p.startsWith("/my-pgs/amenities"), title: "Amenities" },
  { test: (p) => p.startsWith("/my-pgs/restrictions"), title: "House Rules" },
  { test: (p) => p.startsWith("/my-pgs/wifi"), title: "WiFi" },
  { test: (p) => p.startsWith("/my-pgs/notices"), title: "Notices" },
  { test: (p) => p.startsWith("/my-pgs/bank") || p === "/bank", title: "Bank" },
  { test: (p) => p.startsWith("/post-pg") || p.includes("public-listing"), title: "Public Listing" },
  { test: (p) => p.startsWith("/onboarding"), title: "Add PG" },
  { test: (p) => p.startsWith("/my-pgs"), title: "My PG" },
  { test: (p) => p.startsWith("/complaints"), title: "Complaints" },
  { test: (p) => p.startsWith("/food"), title: "Food" },
  { test: (p) => p.startsWith("/team") || p.startsWith("/staff"), title: "Staff" },
  { test: (p) => p.startsWith("/reports"), title: "Reports" },
  { test: (p) => p.startsWith("/expenses"), title: "Expenses" },
  { test: (p) => p.startsWith("/plans") || p.startsWith("/billing"), title: "Plans" },
  { test: (p) => p.startsWith("/settings"), title: "Settings" },
  { test: (p) => p.startsWith("/support"), title: "Support" },
  { test: (p) => p.startsWith("/nightout"), title: "Night out" },
  { test: (p) => p.startsWith("/referrals"), title: "Referrals" },
  { test: (p) => p.startsWith("/activity-logs") || p.startsWith("/audit-logs"), title: "Activity logs" },
];

export function getMobilePageTitle(pathname: string): string {
  const match = TITLE_RULES.find((rule) => rule.test(pathname));
  return match?.title ?? "PG Ease";
}

export function getActiveMobileTab(pathname: string): "home" | "tenants" | "rent" | "mypg" | "menu" {
  if (pathname === "/dashboard" || pathname === "/kpis" || pathname === "/") return "home";
  if (pathname.startsWith("/tenants") || pathname.startsWith("/leads")) return "tenants";
  if (pathname.startsWith("/rent-payments")) return "rent";
  if (pathname.startsWith("/my-pgs") || pathname.startsWith("/post-pg")) return "mypg";
  return "menu";
}
