import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireOwner from "@/components/auth/RequireOwner";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import AddTenantPage from "./pages/tenants/AddTenantPage";
import TenantDetailPage from "./pages/tenants/TenantDetailPage";
import MyPGs from "./pages/MyPGs";
import RentPayments from "./pages/RentPayments";
import Complaints from "./pages/Complaints";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Plans from "./pages/Plans";
import SettingsPage from "./pages/SettingsPage";
import { InventoryManagementPage } from "./pages/inventory/InventoryManagementPage";
import Expenses from "./pages/Expenses";
import Support from "./pages/Support";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import ContactUsPage from "./pages/ContactUsPage";
import Login from "./pages/Login";
import { PublicAuthGate } from "./components/auth/PublicAuthGate";
import { OfflineScreen } from "./components/layout/OfflineScreen";
import NotificationsPage from "./pages/NotificationsPage";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Structure from "./pages/Structure";
import Kyc from "./pages/Kyc";
import { AppProvider } from "./context/AppContext";
import { PermissionProvider } from "./context/PermissionContext";
import TeamIndex from "./pages/team/TeamIndex";
import AddStaff from "./pages/team/AddStaff";
import EditStaffPermissions from "./pages/team/EditStaffPermissions";
import PermissionsMatrixPage from "./pages/team/PermissionsMatrixPage";
import { FeaturePlaceholder } from "./pages/FeaturePlaceholder";
import LeadsPage from "./pages/tenants/LeadsPage";
import SprintToolsPage from "./pages/operations/SprintToolsPage";
import WifiManagementPage from "./pages/property/WifiManagementPage";
import PropertyNoticesPage from "./pages/property/PropertyNoticesPage";
import GuestRequestsPage from "./pages/operations/GuestRequestsPage";
import NightOutRequestsPage from "./pages/operations/NightOutRequestsPage";
import FoodDiningPage from "./pages/food/FoodDiningPage";
import { EaseBuddyAI } from "./components/common/EaseBuddyAI";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import NoticePeriodPage from "./pages/tenants/NoticePeriodPage";
import BankAccountPage from "./pages/property/BankAccountPage";
import { PaymentKycPage } from "./pages/property/PaymentKycPage";
import AmenitiesPage from "./pages/property/AmenitiesPage";
import RestrictionsPage from "./pages/property/RestrictionsPage";
import WhatsAppRedirectPage from "./pages/WhatsAppRedirectPage";
import GroupChatPage from "./pages/chat/GroupChatPage";
import ReferralsPage from "./pages/ReferralsPage";
import ApiCatalogPage from "./pages/reference/ApiCatalogPage";
import PublicListingPage from "./pages/property/PublicListingPage";
import FeatureCataloguePage from "./pages/FeatureCataloguePage";
import { TutorialProvider } from "./context/TutorialContext";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setAppStatusBar } from "@/utils/statusBar";
import { hydrateAuthStorage, initPersistentAuthLifecycle } from "@/api/http";
import { toast } from "@/components/ui/use-toast";
import { resolveActiveTab } from "@/mobile/components/ui/MobileBottomNavV2";

import { GlobalErrorBoundary } from "@/components/common/GlobalErrorBoundary";
import GalleryPage from "@/mobile/pages/GalleryPage";
import MobileMenuV2 from "@/mobile/pages/MobileMenuV2";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const AndroidBackManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackRef = useRef(0);

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || Boolean((window as any).Capacitor?.isNativePlatform?.()));
    if (isMobile) setAppStatusBar(true);
  }, [location.pathname]);

  useEffect(() => {
    const capApp = (window as any).Capacitor?.Plugins?.App;
    if (!capApp?.addListener) return;

    const listener = capApp.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
      // 1. Close open dialog/sheet if any
      const closeBtn = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement | null;
      if (closeBtn) {
        closeBtn.click();
        return;
      }

      const tab = resolveActiveTab(location.pathname);
      const isTabRoot = ["/dashboard", "/", "/kpis", "/my-pgs", "/tenants", "/rent-payments", "/menu"].includes(location.pathname);

      // 2. Pushed screen -> pop
      if (!isTabRoot && canGoBack) {
        navigate(-1);
        return;
      }

      // 3. Non-dashboard tab root -> go to Dashboard
      if (tab !== "dashboard") {
        navigate("/dashboard");
        return;
      }

      // 4. Dashboard root -> double back to exit
      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        void capApp.exitApp();
      } else {
        lastBackRef.current = now;
        toast({ title: "Press back again to exit" });
      }
    });

    return () => {
      void listener?.then?.((h: { remove: () => void }) => h.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};

const App = () => {
  useEffect(() => {
    setAppStatusBar(false);
    void hydrateAuthStorage();
    initPersistentAuthLifecycle();
  }, []);

  return (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineScreen />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AndroidBackManager />
        <Routes>
          {/* Auth routes (no layout) — logged-in users go to dashboard; app shell shows splash first */}
          {import.meta.env.DEV && <Route path="/__gallery" element={<GalleryPage />} />}
          <Route path="/" element={<PublicAuthGate><Login /></PublicAuthGate>} />
          <Route path="/login" element={<PublicAuthGate><Login /></PublicAuthGate>} />
          <Route path="/signup" element={<PublicAuthGate><Login initialMode="signup" /></PublicAuthGate>} />
          <Route path="/wa/*" element={<WhatsAppRedirectPage />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <AppProvider>
                  <Onboarding />
                </AppProvider>
              </RequireAuth>
            }
          />

          {/* App routes (with layout) */}
          <Route
            path="/*"
            element={
              <RequireAuth>
                <AppProvider>
                  <PermissionProvider>
                    <TutorialProvider>
                      <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/menu" element={<MobileMenuV2 />} />
                        <Route path="/kpis" element={<Dashboard />} />
                        <Route path="/tenants/add" element={<AddTenantPage />} />
                        <Route path="/tenants/vacant-rooms" element={<Tenants />} />
                        <Route path="/tenants/guests" element={<GuestRequestsPage />} />
                        <Route path="/guests" element={<Navigate to="/tenants/guests" replace />} />
                        <Route path="/guest-requests" element={<Navigate to="/tenants/guests" replace />} />
                        <Route path="/operations/guests" element={<Navigate to="/tenants/guests" replace />} />
                        <Route path="/operations/guest-requests" element={<Navigate to="/tenants/guests" replace />} />
                        <Route path="/tenants/kyc" element={<Kyc />} />
                        <Route path="/tenants/notice-period" element={<NoticePeriodPage />} />
                        <Route path="/tenants/notice" element={<NoticePeriodPage />} />
                        <Route path="/tenants/onboarding" element={<NoticePeriodPage />} />
                        <Route path="/notice-period" element={<NoticePeriodPage />} />
                        <Route path="/tenants/:tenantId" element={<TenantDetailPage />} />
                        <Route path="/tenants" element={<Tenants />} />
                        <Route path="/leads" element={<LeadsPage />} />
                        <Route path="/my-pgs" element={<MyPGs />} />
                        <Route path="/my-pgs/structure" element={<Structure />} />
                        <Route path="/my-pgs/amenities" element={<AmenitiesPage />} />
                        <Route path="/my-pgs/facilities" element={<AmenitiesPage />} />
                        <Route path="/my-pgs/restrictions" element={<RestrictionsPage />} />
                        <Route path="/my-pgs/wifi" element={<WifiManagementPage />} />
                        <Route path="/my-pgs/notices" element={<PropertyNoticesPage />} />
                        <Route path="/notices" element={<Navigate to="/my-pgs/notices" replace />} />
                        <Route path="/my-pgs/rooms" element={<Structure />} />
                        <Route path="/my-pgs/bank" element={<RequireOwner><BankAccountPage /></RequireOwner>} />
                        <Route path="/bank" element={<RequireOwner><BankAccountPage /></RequireOwner>} />
                        <Route path="/rent-payments" element={<RentPayments />} />
                        <Route path="/rent-payments/history" element={<RentPayments />} />
                        <Route path="/rent-payments/dues" element={<RentPayments />} />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/operations/tools" element={<SprintToolsPage />} />
                        <Route path="/rent-payments/pending" element={<Navigate to="/rent-payments/dues" replace />} />
                        <Route path="/group-chat" element={<GroupChatPage />} />
                        <Route path="/chat" element={<GroupChatPage />} />
                        <Route path="/property" element={<Navigate to="/my-pgs" replace />} />
                        <Route path="/operations" element={<Navigate to="/complaints" replace />} />
                        <Route path="/account" element={<Navigate to="/settings" replace />} />
                        <Route path="/staff/roles" element={<Staff />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/expenses/categories" element={<Expenses />} />
                        <Route path="/expenses/monthly" element={<Expenses />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/reports/payments" element={<Reports />} />
                        <Route path="/reports/export" element={<Reports />} />
                        <Route path="/plans" element={<RequireOwner><Plans /></RequireOwner>} />
                        <Route path="/referrals" element={<RequireOwner><ReferralsPage /></RequireOwner>} />
                        <Route path="/feature-catalogue" element={<FeatureCataloguePage />} />
                        <Route path="/api-catalog" element={<ApiCatalogPage />} />
                        <Route path="/reference/api-catalog" element={<ApiCatalogPage />} />
                        <Route path="/refer-and-earn" element={<RequireOwner><ReferralsPage /></RequireOwner>} />
                        <Route path="/post-pg" element={<PublicListingPage />} />
                        <Route path="/my-pgs/public-listing" element={<PublicListingPage />} />
                        <Route path="/public-listing" element={<PublicListingPage />} />
                        <Route path="/activity-logs" element={<ActivityLogsPage />} />
                        <Route path="/audit-logs" element={<ActivityLogsPage />} />
                        <Route path="/settings/activity-logs" element={<ActivityLogsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/settings/payment-kyc" element={<RequireOwner><PaymentKycPage /></RequireOwner>} />
                        <Route path="/settings/gateway-kyc" element={<RequireOwner><PaymentKycPage /></RequireOwner>} />
                        <Route path="/settings/inventory" element={<InventoryManagementPage />} />
                        <Route path="/inventory" element={<InventoryManagementPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/notifications/preferences" element={<SettingsPage />} />
                        <Route path="/settings/notifications" element={<SettingsPage />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-and-conditions" element={<TermsConditionsPage />} />
                        <Route path="/contact-us" element={<ContactUsPage />} />
                        <Route path="/team" element={<RequireOwner><TeamIndex /></RequireOwner>} />
                        <Route path="/team/add-staff" element={<RequireOwner><AddStaff /></RequireOwner>} />
                        <Route path="/team/:staffId/permissions" element={<RequireOwner><EditStaffPermissions /></RequireOwner>} />
                        <Route path="/team/permissions" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/team/permissions-matrix" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/settings/permissions" element={<RequireOwner><PermissionsMatrixPage /></RequireOwner>} />
                        <Route path="/food" element={<FoodDiningPage />} />
                        <Route path="/food-menu" element={<Navigate to="/food" replace />} />
                        <Route path="/dining" element={<Navigate to="/food" replace />} />
                        <Route path="/billing" element={<RequireOwner><Plans /></RequireOwner>} />
                        <Route path="/subscription" element={<RequireOwner><Plans /></RequireOwner>} />
                        <Route path="/nightout" element={<NightOutRequestsPage />} />
                        <Route path="/night-out" element={<NightOutRequestsPage />} />
                        <Route path="/tenants/night-out" element={<NightOutRequestsPage />} />
                        <Route path="/operations/night-out" element={<NightOutRequestsPage />} />
                        <Route
                          path="/eviction"
                          element={<FeaturePlaceholder title="Eviction" permission="eviction_approve" />}
                        />
                        <Route
                          path="/refunds"
                          element={<FeaturePlaceholder title="Refunds" permission="refund_add" />}
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                      <EaseBuddyAI />
                    </AppLayout>
                  </TutorialProvider>
                </PermissionProvider>
                </AppProvider>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
</GlobalErrorBoundary>
  );
};

export default App;
