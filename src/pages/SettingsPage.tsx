import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Gift,
  CreditCard,
  Globe,
  UserCheck,
  CalendarCheck,
  Utensils,
  FileCheck,
  Bell,
  Shield,
  Loader2,
  Upload,
  ChevronRight,
  Edit2,
  Check,
  X,
  Clock,
  Sparkles,
  AlertTriangle,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  HeartCrack,
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import { useApp } from "@/context/AppContext";
import { PageHeader } from "@/components/common/PageHeader";
import {
  useUploadPhotoMutation,
  useDeleteProfilePhotoMutation,
  useUpdateMeMutation,
  useAccountDeleteRequest,
  useDeletePropertyMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { toast } from "@/components/ui/use-toast";
import { ManagementDetailsDrawer } from "@/components/settings/ManagementDetailsDrawer";
import { publicListingUrl } from "@/config/links";
import { createOps, listOps } from "@/api/ownerOps";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function SettingsPage() {
  const { language, setLanguage, selectedPgId, properties, refreshProperties, setSelectedPgId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isNotifications = location.pathname.includes("/notifications");

  useEffect(() => {
    if (searchParams.get("tab") === "activity") {
      navigate("/activity-logs", { replace: true });
    } else if (searchParams.get("editProfile") === "true" || searchParams.get("edit") === "profile") {
      setIsEditingProfile(true);
    }
  }, [searchParams, navigate]);

  const [managementDrawerOpen, setManagementDrawerOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [dueDay, setDueDay] = useState(() => localStorage.getItem("pgease_rent_due_day") || "5");
  const [graceDays, setGraceDays] = useState(() => localStorage.getItem("pgease_rent_grace_days") || "3");
  const [lateFee, setLateFee] = useState(() => localStorage.getItem("pgease_rent_late_fee") || "0");
  const [noticeDays, setNoticeDays] = useState(() => localStorage.getItem("pgease_notice_days") || "30");
  const [notifyComplaints, setNotifyComplaints] = useState(() => localStorage.getItem("pgease_notify_complaints") !== "off");
  const [notifyPayments, setNotifyPayments] = useState(() => localStorage.getItem("pgease_notify_payments") !== "off");
  const [notifyKyc, setNotifyKyc] = useState(() => localStorage.getItem("pgease_notify_kyc") !== "off");

  useEffect(() => {
    if (!selectedPgId) return;
    void listOps(selectedPgId, "billing_rules").then((items) => {
      const rules = items[0];
      if (!rules) return;
      if (rules.dueDay != null) setDueDay(String(rules.dueDay));
      if (rules.graceDays != null) setGraceDays(String(rules.graceDays));
      if (rules.lateFee != null) setLateFee(String(rules.lateFee));
    }).catch(() => undefined);
    void listOps(selectedPgId, "notification_settings").then((items) => {
      const prefs = items[0];
      if (!prefs) return;
      if (typeof prefs.complaints === "boolean") setNotifyComplaints(prefs.complaints);
      if (typeof prefs.payments === "boolean") setNotifyPayments(prefs.payments);
      if (typeof prefs.kyc === "boolean") setNotifyKyc(prefs.kyc);
    }).catch(() => undefined);
  }, [selectedPgId]);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadPhotoMutation();
  const deletePhotoMut = useDeleteProfilePhotoMutation();
  const updateMeMut = useUpdateMeMutation();
  const meQuery = useQuery({
    queryKey: ["property-owner", "me"],
    queryFn: getMe,
  });
  const me = meQuery.data;

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerCountryCode, setOwnerCountryCode] = useState("+91");
  const [ownerLanguage, setOwnerLanguage] = useState<"en-US" | "hi-IN">("en-US");

  const isOwner = authStorage.isOwner();
  const deleteReqQuery = useAccountDeleteRequest();
  const deleteRequest = deleteReqQuery.data?.request;

  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [deleteBuildingDialogOpen, setDeleteBuildingDialogOpen] = useState(false);
  const [deleteBuildingStep, setDeleteBuildingStep] = useState<1 | 2>(1);
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<string>("");
  const [buildingConfirmName, setBuildingConfirmName] = useState("");
  const deletePropertyMutation = useDeletePropertyMutation();

  const selectedBuildingObj = Array.isArray(properties)
    ? properties.find((p) => p.id === buildingToDelete)
    : null;

  const handleDeleteBuilding = async () => {
    if (!buildingToDelete || !selectedBuildingObj) return;
    try {
      await deletePropertyMutation.mutateAsync(buildingToDelete);
      toast({
        title: "Building Deleted",
        description: `"${selectedBuildingObj.name}" has been permanently deleted.`,
      });
      setDeleteBuildingDialogOpen(false);
      setBuildingConfirmName("");
      const remaining = Array.isArray(properties)
        ? properties.filter((p) => p.id !== buildingToDelete)
        : [];
      if (selectedPgId === buildingToDelete) {
        setSelectedPgId(remaining[0]?.id || null);
      }
      await refreshProperties();
    } catch (e: unknown) {
      toast({
        title: "Failed to delete building",
        description:
          e instanceof Error ? e.message : "Ensure no active residing tenants remain before deleting.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (me) {
      setOwnerName(me.name || "");
      setOwnerEmail(me.email && !me.email.endsWith(".local") ? me.email : "");
      setOwnerPhone(me.mobileContactNumber || "");
      setOwnerCountryCode(me.countryCode || "+91");
      setOwnerLanguage((me.language as "en-US" | "hi-IN") || "en-US");
    }
  }, [me]);

  const handleSaveProfile = async () => {
    if (!ownerName.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    try {
      const updated = await updateMeMut.mutateAsync({
        name: ownerName.trim(),
        email: ownerEmail.trim() || undefined,
        mobileContactNumber: ownerPhone.trim() || undefined,
        countryCode: ownerCountryCode.trim() || undefined,
        language: ownerLanguage,
      });

      if (updated) {
        authStorage.setPropertyOwner(updated);
      }

      toast({
        title: "Profile updated successfully",
        description: "Your name and contact email have been updated.",
      });
      setIsEditingProfile(false);
      void meQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update profile",
        variant: "destructive",
      });
    }
  };

  const currentProperty = properties.find((p) => p.id === selectedPgId);

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMut.mutateAsync(file);
      toast({ title: "Profile photo updated successfully" });
      void meQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    try {
      await deletePhotoMut.mutateAsync();
      toast({ title: "Profile photo removed successfully" });
      void meQuery.refetch();
    } catch (err: unknown) {
      toast({
        title: "Removal failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Page Header */}
      <PageHeader
        title={isNotifications ? "Notification preferences" : "Settings"}
        description={isNotifications
          ? "Choose which owner alerts stay on for this browser."
          : "Configure property business profiles, payouts, tenant verification, and platform preferences."}
        action={
          <Button
            size="sm"
            className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-2 font-medium"
            onClick={() => setManagementDrawerOpen(true)}
          >
            <Building2 className="h-4 w-4" /> Management Details
          </Button>
        }
      />

      {isNotifications && (
        <div className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] p-5 space-y-3">
          <h2 className="text-base font-semibold text-[var(--gray-900)]">Alerts</h2>
          <p className="text-xs text-[var(--gray-600)]">Each event can be sent on WhatsApp, email, or the app. Saved for this PG when the server accepts it, and kept in this browser until then.</p>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--gray-600)]">
                  <th className="py-2">Event</th>
                  <th>WhatsApp</th>
                  <th>Email</th>
                  <th>App</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["Rent reminder", "payments"],
                  ["Complaint update", "complaints"],
                  ["KYC update", "kyc"],
                ] as const).map(([label, key]) => {
                  const on = key === "payments" ? notifyPayments : key === "complaints" ? notifyComplaints : notifyKyc;
                  const setOn = key === "payments" ? setNotifyPayments : key === "complaints" ? setNotifyComplaints : setNotifyKyc;
                  const storageKey = key === "payments" ? "pgease_notify_payments" : key === "complaints" ? "pgease_notify_complaints" : "pgease_notify_kyc";
                  return (
                    <tr key={key} className="border-t border-[var(--gray-200)]">
                      <td className="py-2">{label}</td>
                      {(["WhatsApp", "Email", "App"] as const).map((channel) => (
                        <td key={channel}>
                          <button
                            type="button"
                            aria-pressed={on}
                            className="text-xs font-semibold text-[var(--brand-700)]"
                            onClick={() => {
                              const next = !on;
                              setOn(next);
                              localStorage.setItem(storageKey, next ? "on" : "off");
                              if (selectedPgId) {
                                void createOps(selectedPgId, "notification_settings", {
                                  complaints: key === "complaints" ? next : notifyComplaints,
                                  payments: key === "payments" ? next : notifyPayments,
                                  kyc: key === "kyc" ? next : notifyKyc,
                                  channels: ["WhatsApp", "Email", "App"],
                                }).catch(() => undefined);
                              }
                            }}
                          >
                            {on ? "On" : "Off"}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {([
              ["Rent reminder", "payments"],
              ["Complaint update", "complaints"],
              ["KYC update", "kyc"],
            ] as const).map(([label, key]) => {
              const on = key === "payments" ? notifyPayments : key === "complaints" ? notifyComplaints : notifyKyc;
              const setOn = key === "payments" ? setNotifyPayments : key === "complaints" ? setNotifyComplaints : setNotifyKyc;
              const storageKey = key === "payments" ? "pgease_notify_payments" : key === "complaints" ? "pgease_notify_complaints" : "pgease_notify_kyc";
              return (
                <div key={key} className="rounded-[16px] border border-[var(--gray-200)] p-3 flex items-center justify-between gap-3 min-h-11">
                  <p className="text-sm font-medium text-[var(--gray-900)]">{label}</p>
                  <button
                    type="button"
                    aria-pressed={on}
                    className="min-h-11 px-3 text-sm font-semibold text-[var(--brand-700)]"
                    onClick={() => {
                      const next = !on;
                      setOn(next);
                      localStorage.setItem(storageKey, next ? "on" : "off");
                      if (selectedPgId) {
                        void createOps(selectedPgId, "notification_settings", {
                          complaints: key === "complaints" ? next : notifyComplaints,
                          payments: key === "payments" ? next : notifyPayments,
                          kyc: key === "kyc" ? next : notifyKyc,
                          channels: ["WhatsApp", "Email", "App"],
                        }).catch(() => undefined);
                      }
                    }}
                  >
                    {on ? "On" : "Off"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: ACCOUNT PROFILE */}
      <div className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--gray-200)] pb-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--gray-900)]">
              Account Profile & Identity
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Registered PG owner credentials, contact details, and default language.
            </p>
          </div>

          {!isEditingProfile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(true)}
              className="h-8 text-xs border-[var(--gray-300)] gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5 text-[var(--brand-600)]" /> Edit Name & Email
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={updateMeMut.isPending}
                onClick={() => {
                  if (me) {
                    setOwnerName(me.name || "");
                    setOwnerEmail(me.email && !me.email.endsWith(".local") ? me.email : "");
                    setOwnerPhone(me.mobileContactNumber || "");
                    setOwnerCountryCode(me.countryCode || "+91");
                    setOwnerLanguage((me.language as "en-US" | "hi-IN") || "en-US");
                  }
                  setIsEditingProfile(false);
                }}
                className="h-8 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={updateMeMut.isPending || !ownerName.trim()}
                onClick={handleSaveProfile}
                className="h-8 text-xs bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white gap-1.5"
              >
                {updateMeMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {meQuery.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--gray-400)]" />
          </div>
        ) : isEditingProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">
                Owner Name <span className="text-[#B42318]">*</span>
              </Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Full Name"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Registered Email</Label>
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  value={ownerCountryCode}
                  onChange={(e) => setOwnerCountryCode(e.target.value)}
                  placeholder="+91"
                  className="w-16 h-9 text-sm text-center px-1 font-mono"
                />
                <Input
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="flex-1 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--gray-700)]">Language</Label>
              <select
                value={ownerLanguage}
                onChange={(e) => setOwnerLanguage(e.target.value as "en-US" | "hi-IN")}
                className="w-full h-9 text-sm rounded-md border border-[var(--gray-300)] bg-white px-3 py-1 text-[var(--gray-900)] focus:outline-none focus:border-[var(--brand-600)]"
              >
                <option value="en-US">English (India)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Owner Name</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 truncate">
                {me?.name || "—"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Registered Email</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 truncate">
                {me?.email && !me.email.endsWith(".local") ? me.email : "Not added"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Phone Number</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5 tabular-nums truncate">
                {me?.mobileContactNumber ? `${me?.countryCode ? me.countryCode + " " : ""}${me.mobileContactNumber}` : "—"}
              </p>
            </div>
            <div className="bg-[var(--gray-50)] p-3 rounded-md border border-[var(--gray-200)]">
              <span className="text-[11px] font-medium text-[var(--gray-500)] block">Language Preference</span>
              <p className="text-sm font-semibold text-[var(--gray-900)] mt-0.5">
                {me?.language === "hi-IN" ? "Hindi (हिंदी)" : "English"}
              </p>
            </div>
          </div>
        )}

        <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--gray-200)]">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-[#008080] to-[#005e5e] text-white flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-slate-200 dark:ring-slate-700">
              {me?.profilePhotoUrl || (me as any)?.photoUrl ? (
                <img
                  src={me?.profilePhotoUrl || (me as any)?.photoUrl}
                  alt={me?.name || "Owner Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{(me?.name || "PO").slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--gray-900)]">Profile Picture</p>
              <p className="text-[11px] text-[var(--gray-500)]">
                {me?.profilePhotoUrl || (me as any)?.photoUrl
                  ? "Personal photo visible on owner account"
                  : "No photo uploaded yet (PNG, JPG, WebP up to 5MB)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={onPickPhoto}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs border-[var(--gray-300)] gap-1.5"
              disabled={uploadMut.isPending || deletePhotoMut.isPending}
              onClick={() => fileRef.current?.click()}
            >
              {uploadMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {me?.profilePhotoUrl || (me as any)?.photoUrl ? "Change photo" : "Upload photo"}
            </Button>
            {me?.profilePhotoUrl || (me as any)?.photoUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
                disabled={deletePhotoMut.isPending || uploadMut.isPending}
                onClick={handleRemovePhoto}
              >
                {deletePhotoMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* SECTION 2: PROPERTY & BANKING */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Property Management & Banking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/my-pgs/bank")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Bank Account & UPI Payouts
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Configure account and QR code for direct tenant payment settlements
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => setManagementDrawerOpen(true)}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Business & Management Profile
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                GSTIN, business registration type, and legal admin details
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => setBillingOpen(true)}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Rent Dues & Billing Rules
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Due day {dueDay}, {graceDays} day grace, late fee ₹{lateFee}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/my-pgs/public-listing")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Public Website & Marketing
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Public listing: {publicListingUrl(selectedPgId)}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 3: OPERATIONS & POLICIES */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Operations & Resident Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/tenants/kyc")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Tenant Onboarding & KYC
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Manage Aadhaar verification, document checklist, and credit balance
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => setNoticeOpen(true)}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Notice Period & Move-Out Rules
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Default notice duration is {noticeDays} days. Open this card to change it.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/food")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                Dining & Food Timings
              </h4>
              <p className="text-xs text-[var(--gray-500)]">
                Meal timings (Breakfast, Lunch, Dinner) and weekly menu schedule
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 4: PLATFORM & REWARDS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Plan, Rewards & Security
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => navigate("/plans")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Subscription & Billing
                </h4>
                <StatusBadge label="Active" tone="success" size="sm" />
              </div>
              <p className="text-xs text-[var(--gray-500)]">
                Manage Lite / Pro plan subscription and payment invoices
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>

          <div
            onClick={() => navigate("/referrals")}
            className="bg-white rounded-[16px] md:rounded-md border border-[var(--gray-200)] hover:border-[var(--gray-300)] p-4 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Referral Rewards
                </h4>
                <span className="text-[11px] font-medium text-[var(--success)] bg-[#ECFAF1] px-1.5 py-0.5 rounded">
                  Earn ₹1,000 / PG
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)]">
                Invite fellow PG owners and track cash rewards directly to your bank
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--gray-400)] shrink-0 ml-3" />
          </div>
        </div>
      </div>

      {/* SECTION 5: DANGER ZONE (OWNER ONLY) */}
      {isOwner && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h3>
          <div className="bg-white rounded-[16px] md:rounded-md border border-red-200 p-4 space-y-4">
            {/* Show any prior request status banner if present */}
            {deleteRequest && deleteRequest.status === "pending" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-md p-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                      Deletion Request Under Review
                    </span>
                    <StatusBadge label="Pending Review" tone="warning" size="sm" />
                  </div>
                  <p className="text-xs text-amber-700">
                    Submitted on{" "}
                    {new Date(deleteRequest.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {deleteRequest.reason ? ` • Reason: "${deleteRequest.reason}"` : ""}.
                  </p>
                  <p className="text-xs text-amber-600">
                    Our compliance team is reviewing your request. For urgent requests, please contact support.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0 gap-1.5"
                  onClick={() => setSupportDialogOpen(true)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Contact Support
                </Button>
              </div>
            )}

            {deleteRequest && deleteRequest.status === "rejected" && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-md p-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                      Deletion Request Declined
                    </span>
                    <StatusBadge label="Declined" tone="danger" size="sm" />
                  </div>
                  <p className="text-xs text-red-700">
                    Your previous request was declined
                    {deleteRequest.adminNote ? `: "${deleteRequest.adminNote}"` : "."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 shrink-0 gap-1.5"
                  onClick={() => setSupportDialogOpen(true)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Contact Support
                </Button>
              </div>
            )}

            {/* Option 1: Delete a Single PG Building */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Delete a Single PG Building
                </h4>
                <p className="text-xs text-[var(--gray-500)] max-w-xl">
                  Permanently delete an individual PG building and its rooms. Your account, other PG buildings, and remaining data stay completely intact.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400 shrink-0 gap-1.5"
                onClick={() => {
                  setBuildingToDelete(selectedPgId || (Array.isArray(properties) && properties[0]?.id) || "");
                  setBuildingConfirmName("");
                  setDeleteBuildingStep(1);
                  setDeleteUnderstood(false);
                  setDeleteBuildingDialogOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete a Building
              </Button>
            </div>

            <div className="border-t border-gray-100" />

            {/* Option 2: Complete Account Deletion (Contact Support Only) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[var(--gray-900)]">
                  Complete Account Deletion
                </h4>
                <p className="text-xs text-[var(--gray-500)] max-w-xl">
                  To permanently delete your entire owner account and purge all data, contact our support team. Complete account deletion requires identity & compliance verification.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shrink-0 gap-1.5"
                onClick={() => setSupportDialogOpen(true)}
              >
                <Phone className="h-3.5 w-3.5" />
                Contact Support to Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete a PG Building Dialog (2-Step with Goodbye & Irreversible Data Warning) */}
      <Dialog
        open={deleteBuildingDialogOpen}
        onOpenChange={(open) => {
          setDeleteBuildingDialogOpen(open);
          if (!open) {
            setDeleteBuildingStep(1);
            setDeleteUnderstood(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          {deleteBuildingStep === 1 ? (
            /* STEP 1: SELECT BUILDING & TYPE NAME CONFIRMATION */
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-lg font-bold text-[var(--gray-900)]">
                  Delete a Single PG Building
                </DialogTitle>
                <DialogDescription className="text-center text-xs text-[var(--gray-500)]">
                  Step 1 of 2: Select the building you want to delete and verify its name.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[var(--gray-700)]">
                    Select PG Building to Delete
                  </Label>
                  <select
                    value={buildingToDelete}
                    onChange={(e) => {
                      setBuildingToDelete(e.target.value);
                      setBuildingConfirmName("");
                    }}
                    className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium focus:border-red-500 focus:outline-none"
                  >
                    {Array.isArray(properties) &&
                      properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.address ? `(${p.address})` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedBuildingObj && (
                  <>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold">Notice before proceeding:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Active residing tenants should be checked out or transferred first.</li>
                        <li>Only <strong>{selectedBuildingObj.name}</strong> will be deleted; other PGs remain safe.</li>
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[var(--gray-700)]">
                        Type <span className="font-bold text-red-600">{selectedBuildingObj.name}</span> to proceed:
                      </Label>
                      <Input
                        value={buildingConfirmName}
                        onChange={(e) => setBuildingConfirmName(e.target.value)}
                        placeholder="Type PG name exactly..."
                        className="text-xs h-9"
                      />
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteBuildingDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDeleteBuildingStep(2)}
                  disabled={
                    !selectedBuildingObj ||
                    buildingConfirmName.trim() !== selectedBuildingObj.name.trim()
                  }
                  className="gap-1.5 font-bold bg-red-600 hover:bg-red-700 text-white"
                >
                  <span>Proceed to Final Confirmation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* STEP 2: BYE BYE WE WILL MISS YOU + DOUBLE DATA LOSS CONFIRMATION */
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-xs animate-bounce">
                  <HeartCrack className="h-7 w-7" />
                </div>
                <DialogTitle className="text-center text-xl font-black text-rose-950">
                  Bye Bye, {selectedBuildingObj?.name}! 🥺
                </DialogTitle>
                <DialogDescription className="text-center text-xs text-rose-700 font-medium">
                  We will miss having this property on PG Ease. Saying goodbye is never easy!
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                {/* Critical Double-Confirmation Warning Box */}
                <div className="rounded-2xl bg-red-50/90 border border-red-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs">
                    <AlertOctagon className="h-4 w-4 text-red-600 shrink-0" />
                    <span>Are you sure you want to delete?</span>
                  </div>
                  <p className="font-bold text-red-800 leading-snug">
                    You will <span className="underline decoration-red-500 font-black">NOT</span> be able to retrieve or recover this data once deleted.
                  </p>
                  <ul className="space-y-1 text-[11px] text-red-700 list-disc pl-4 pt-1">
                    <li>All rooms, bed inventories, and tenant assignments will be permanently deleted.</li>
                    <li>Past rent collection receipts, payment records, and ledger histories will be lost.</li>
                    <li>Food meal plans, complaints, and staff logs for this PG will be permanently wiped.</li>
                    <li>This action is 100% permanent. PG Ease support cannot restore this data.</li>
                  </ul>
                </div>

                {/* Checkbox to confirm */}
                <div className="rounded-xl border border-red-200 bg-white p-3 flex items-start gap-2.5 shadow-2xs">
                  <input
                    type="checkbox"
                    id="settings-confirm-delete-data"
                    checked={deleteUnderstood}
                    onChange={(e) => setDeleteUnderstood(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label
                    htmlFor="settings-confirm-delete-data"
                    className="text-xs text-red-950 font-medium cursor-pointer select-none leading-tight"
                  >
                    I understand that this property will be wiped permanently and I will <strong className="font-extrabold text-red-700">never be able to retrieve this data</strong>.
                  </label>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteBuildingStep(1)}
                  disabled={deletePropertyMutation.isPending}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back / Keep PG</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteBuilding}
                  disabled={deletePropertyMutation.isPending || !deleteUnderstood}
                  className="gap-1.5 font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
                >
                  {deletePropertyMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Wiping & Deleting...
                    </>
                  ) : (
                    "Yes, Permanently Delete & Wipe Data"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Support for Complete Account Deletion Dialog */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Shield className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-[var(--gray-900)]">
              Contact Support for Account Deletion
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-[var(--gray-500)]">
              To permanently delete your entire PG Ease property owner account and all associated records, please reach out to our support and compliance desk directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <p className="font-semibold text-slate-900">Why Contact Support?</p>
              <p className="text-slate-600">
                Complete account deletion irrevocably purges all properties, rooms, tenant payment ledgers, and KYC data. Our team will verify your identity and guide you through the process within 24 hours.
              </p>
            </div>

            <div className="space-y-2">
              <a
                href="https://wa.me/918920215953?text=Hi%20PG%20Ease%20Support,%20I%20would%20like%20to%20request%20complete%20deletion%20of%20my%20owner%20account."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-900 transition-all font-semibold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">Chat on WhatsApp</p>
                    <p className="text-[11px] font-normal text-emerald-700">+91 8920215953 • Instant Support</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-600" />
              </a>

              <a
                href="mailto:support@pgease.com?subject=Owner%20Account%20Deletion%20Request"
                className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 text-blue-900 transition-all font-semibold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">Email Support Desk</p>
                    <p className="text-[11px] font-normal text-blue-700">support@pgease.com</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-blue-600" />
              </a>

              <a
                href="tel:+918920215953"
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-900 transition-all font-semibold text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gray-700 text-white flex items-center justify-center">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold">Call Helpline</p>
                    <p className="text-[11px] font-normal text-gray-600">+91 8920215953 (Mon - Sat, 9am - 8pm)</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSupportDialogOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slide-over Drawer for Management Details */}
      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rent dues and billing rules</DialogTitle>
            <DialogDescription>Saved on this device only. Set the monthly due day, grace period, and late fee for this browser.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="rent-due-day">Rent due day</Label>
              <Input id="rent-due-day" type="number" min={1} max={28} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rent-grace">Grace period (days)</Label>
              <Input id="rent-grace" type="number" min={0} max={15} value={graceDays} onChange={(e) => setGraceDays(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rent-late-fee">Late fee (₹)</Label>
              <Input id="rent-late-fee" type="number" min={0} value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => {
              localStorage.setItem("pgease_rent_due_day", dueDay || "5");
              localStorage.setItem("pgease_rent_grace_days", graceDays || "0");
              localStorage.setItem("pgease_rent_late_fee", lateFee || "0");
              if (selectedPgId) {
                void createOps(selectedPgId, "billing_rules", {
                  dueDay: Number(dueDay) || 5,
                  graceDays: Number(graceDays) || 0,
                  lateFee: Number(lateFee) || 0,
                }).then(() => toast({ title: "Billing rules saved" }))
                  .catch(() => toast({ title: "Saved on this device only", variant: "destructive" }));
              } else {
                toast({ title: "Billing rules saved" });
              }
              setBillingOpen(false);
            }}>Save rules</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notice period and move-out rules</DialogTitle>
            <DialogDescription>This is the default notice length shown to new tenants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="notice-days">Default notice (days)</Label>
            <Input id="notice-days" type="number" min={1} max={90} value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/tenants/notice-period")}>View tenants on notice</Button>
            <Button type="button" onClick={() => {
              localStorage.setItem("pgease_notice_days", noticeDays || "30");
              setNoticeOpen(false);
              toast({ title: "Notice period saved" });
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManagementDetailsDrawer
        open={managementDrawerOpen}
        onOpenChange={setManagementDrawerOpen}
        property={currentProperty}
      />
    </div>
  );
}
