import {
  BarChart3,
  Building2,
  IndianRupee,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UserCog,
  Users,
  Wrench,
  Crown,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  title: string;
  url: string;
  badge?: string;
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
  isExternal?: boolean;
}

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  section?: string;
  badge?: string;
  children?: NavChild[];
  permissionKey?: string;
  featureKey?: string;
  ownerOnly?: boolean;
}

/**
 * Single navigation tree for the desktop sidebar and the phone menu.
 * Labels match the routes in App.tsx.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "Overview",
    permissionKey: "dashboard_access",
  },
  {
    title: "Property",
    url: "/my-pgs",
    icon: Building2,
    section: "Management",
    permissionKey: "room_view",
    children: [
      { title: "PG Details", url: "/my-pgs", permissionKey: "room_view" },
      { title: "Rooms & Beds", url: "/my-pgs/structure", permissionKey: "room_view" },
      { title: "Facilities", url: "/my-pgs/amenities", permissionKey: "room_view" },
      { title: "Restrictions", url: "/my-pgs/restrictions", permissionKey: "room_view" },
      { title: "WiFi", url: "/my-pgs/wifi", permissionKey: "room_view", featureKey: "wifi_management", badge: "Beta" },
      { title: "Notice Board", url: "/my-pgs/notices", permissionKey: "room_view" },
      { title: "Bank Account", url: "/my-pgs/bank", ownerOnly: true },
      { title: "Public Listing", url: "/post-pg", permissionKey: "room_view", badge: "Live" },
    ],
  },
  {
    title: "Tenants",
    url: "/tenants",
    icon: Users,
    permissionKey: "tenant_view",
    children: [
      { title: "All Tenants", url: "/tenants", permissionKey: "tenant_view" },
      { title: "Leads & Visits", url: "/leads", permissionKey: "tenant_view", featureKey: "lead_crm", badge: "Beta" },
      { title: "KYC & Agreements", url: "/tenants/kyc", permissionKey: "kyc_view", featureKey: "aadhaar_kyc" },
      { title: "Notice Period", url: "/tenants/notice-period", permissionKey: "tenant_view" },
    ],
  },
  {
    title: "Rent & Payments",
    url: "/rent-payments",
    icon: IndianRupee,
    section: "Finance & Ops",
    permissionKey: "account_view_dues",
    children: [
      { title: "Rent Collection", url: "/rent-payments", permissionKey: "account_view_dues" },
      { title: "Payment History", url: "/rent-payments/history", permissionKey: "account_view_dues" },
      { title: "Dues & Pending", url: "/rent-payments/dues", permissionKey: "account_view_dues" },
      { title: "Expenses", url: "/expenses", permissionKey: "expense_view", featureKey: "expense_tracking" },
    ],
  },
  {
    title: "Operations",
    url: "/complaints",
    icon: Wrench,
    permissionKey: "complaint_view_all",
    children: [
      { title: "Complaints", url: "/complaints", permissionKey: "complaint_view_all" },
      { title: "Food & Meals", url: "/food", permissionKey: "food_view_edit" },
      { title: "Night Out Logs", url: "/nightout", permissionKey: "nightout_view" },
      { title: "Guest Requests", url: "/tenants/guests", permissionKey: "guest_log" },
    ],
  },
  {
    title: "Group Chat",
    url: "/group-chat",
    icon: MessageSquare,
    badge: "Soon",
  },
  {
    title: "Staff",
    url: "/team",
    icon: UserCog,
    ownerOnly: true,
    permissionKey: "team_view_members",
    featureKey: "staff_roles_permissions",
    children: [
      { title: "Team Members", url: "/team", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
      { title: "Permissions", url: "/team/permissions-matrix", ownerOnly: true, permissionKey: "team_view_members", featureKey: "staff_roles_permissions" },
    ],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    section: "System",
    badge: "Pro",
    permissionKey: "account_view_dues",
    featureKey: "advanced_reports",
  },
  {
    title: "Subscription Plans",
    url: "/plans",
    icon: Crown,
    ownerOnly: true,
  },
  {
    title: "Account",
    url: "/settings",
    icon: Settings,
    children: [
      { title: "Settings", url: "/settings" },
      { title: "Plans & Billing", url: "/plans", ownerOnly: true },
      { title: "Refer & Earn", url: "/referrals", ownerOnly: true },
      { title: "Help & Documentation", url: "https://help.pgease.com", isExternal: true },
      { title: "Activity Logs", url: "/activity-logs", featureKey: "audit_logs" },
    ],
  },
];
