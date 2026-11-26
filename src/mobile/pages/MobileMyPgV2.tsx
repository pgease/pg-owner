import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban,
  BedDouble,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Globe,
  Image as ImageIcon,
  Landmark,
  Megaphone,
  Moon,
  Pencil,
  Phone,
  Sparkles,
  UserCheck,
  UserCog,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { usePropertySummary } from "@/mobile/hooks/usePropertySummary";
import { useNetworkStatus } from "@/mobile/hooks/useNetworkStatus";
import { useAmenities, useUpdatePropertyMutation } from "@/hooks/usePropertyOwnerQueries";
import { DEFAULT_PROPERTY_TYPE_ID } from "@/api/propertyOwner";
import { authStorage } from "@/api/http";
import { formatCount } from "@/mobile/utils/formatters";
import type { IconTone } from "@/mobile/tokens";
import { MobileAppHeader } from "@/mobile/components/ui/MobileHeaders";
import { PageScaffold } from "@/mobile/components/ui/PageScaffold";
import {
  BottomSheet,
  IconTile,
  ListRow,
  MobileCard,
  PrimaryButton,
  SectionHeader,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { toast } from "@/components/ui/use-toast";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";

export function MobileMyPgV2() {
  const navigate = useNavigate();
  const { selectedPgId, properties, refreshProperties } = useApp();
  const { summary, refetchAll } = usePropertySummary(selectedPgId);
  const { data: rawAmenities = [] } = useAmenities(selectedPgId);
  const { isOffline, lastUpdated } = useNetworkStatus();
  const updateMutation = useUpdatePropertyMutation();

  const list = Array.isArray(properties) ? properties : [];
  const selectedPg = list.find((p) => p.id === selectedPgId);
  const owner = authStorage.getPropertyOwner();

  const [editOpen, setEditOpen] = useState(false);
  const [pgName, setPgName] = useState("");
  const [pgAddress, setPgAddress] = useState("");
  const [pgPin, setPgPin] = useState("");
  const [pgBedRange, setPgBedRange] = useState("");

  useEffect(() => {
    if (!selectedPg) return;
    setPgName(selectedPg.name || "");
    setPgAddress(selectedPg.address || "");
    setPgPin(String(selectedPg.locationPin ?? ""));
    setPgBedRange(selectedPg.bedRange ?? "50-100");
  }, [selectedPg]);

  const handleSave = async () => {
    if (isOffline) {
      toast({ title: "You're offline", description: "Connect to the internet to update property details." });
      return;
    }
    if (!selectedPgId || !selectedPg) return;
    if (!pgName.trim()) {
      toast({ title: "PG Name is required", variant: "destructive" });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        propertyId: selectedPgId,
        payload: {
          name: pgName.trim(),
          address: pgAddress.trim(),
          locationPin: pgPin.trim(),
          bedRange: pgBedRange.trim() || "50-100",
          latitude: Number(selectedPg.latitude) || 0,
          longitude: Number(selectedPg.longitude) || 0,
          propertyTypeId: selectedPg.propertyTypeId || DEFAULT_PROPERTY_TYPE_ID,
          photos: selectedPg.photos || [],
        },
      });
      await refreshProperties();
      setEditOpen(false);
      toast({ title: "Property Details Saved", description: "Your PG profile has been updated." });
    } catch (e: unknown) {
      toast({
        title: "Failed to update property",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const photoUrl = Array.isArray(selectedPg?.photos) && selectedPg.photos.length > 0 ? selectedPg.photos[0] : null;
  const photosCount = Array.isArray(selectedPg?.photos) ? selectedPg.photos.length : 0;
  const linkedAmenities = Array.isArray(rawAmenities) ? rawAmenities.filter((a: any) => a.linked).length : 0;
  const facilitiesCount =
    linkedAmenities > 0
      ? linkedAmenities
      : Array.isArray((selectedPg as any)?.amenities)
        ? (selectedPg as any).amenities.length
        : 0;

  const phone =
    (selectedPg as any)?.contactNumber ||
    (selectedPg as any)?.phone ||
    (owner as any)?.mobileContactNumber ||
    (owner as any)?.phone ||
    "";

  const managementItems: Array<{ title: string; sub: string; tone: IconTone; icon: React.ReactNode; to: string }> = [
    { title: "PG Layout Management", sub: "Manage blocks, floors & beds", tone: "teal", icon: <BedDouble className="h-5 w-5" />, to: "/my-pgs/structure" },
    { title: "Staff Management", sub: "Manage your staff and team", tone: "blue", icon: <UserCog className="h-5 w-5" />, to: "/team" },
    { title: "Payment Details", sub: "Bank accounts, UPI & online payouts", tone: "green", icon: <Landmark className="h-5 w-5" />, to: "/my-pgs/bank" },
    { title: "Wi-Fi Information", sub: "Manage Wi-Fi details & passwords", tone: "sky", icon: <Wifi className="h-5 w-5" />, to: "/my-pgs/wifi" },
    { title: "Photos & Videos", sub: "Manage your PG media gallery", tone: "rose", icon: <ImageIcon className="h-5 w-5" />, to: "/post-pg" },
    { title: "KYC & Agreements", sub: "Manage tenant KYC & agreements", tone: "amber", icon: <FileCheck2 className="h-5 w-5" />, to: "/tenants/kyc" },
    { title: "Gate Requests & Night Out", sub: "Night out passes & visitor logs", tone: "indigo", icon: <Moon className="h-5 w-5" />, to: "/nightout" },
    { title: "Public Listing", sub: "Publish your PG to attract tenants", tone: "emerald", icon: <Globe className="h-5 w-5" />, to: "/post-pg" },
  ];

  const facilityItems: Array<{ title: string; sub: string; tone: IconTone; icon: React.ReactNode; to: string }> = [
    { title: "Dining Schedule", sub: "Define meal timings & weekly menu", tone: "orange", icon: <UtensilsCrossed className="h-5 w-5" />, to: "/food" },
    { title: "Facilities", sub: "Configure available PG facilities", tone: "violet", icon: <Sparkles className="h-5 w-5" />, to: "/my-pgs/amenities" },
    { title: "PG Restrictions", sub: "Set PG rules and restrictions", tone: "red", icon: <Ban className="h-5 w-5" />, to: "/my-pgs/restrictions" },
  ];

  const moreItems: Array<{ title: string; sub: string; tone: IconTone; icon: React.ReactNode; to: string }> = [
    { title: "Notice Board", sub: "Broadcast updates to residents", tone: "violet", icon: <Megaphone className="h-5 w-5" />, to: "/my-pgs/notices" },
    { title: "Guest Requests", sub: "Approve visitor stays", tone: "blue", icon: <UserCheck className="h-5 w-5" />, to: "/tenants/guests" },
    { title: "Payment Gateway KYC", sub: "Online collection verification", tone: "amber", icon: <CreditCard className="h-5 w-5" />, to: "/settings/payment-kyc" },
  ];

  return (
    <PageScaffold
      isOffline={isOffline}
      lastUpdated={lastUpdated}
      onRefresh={refetchAll}
      header={
        <MobileAppHeader
          showPgSwitcher={true}
          title="My Property"
          className="pb-6"
          row2={
            <div className="rounded-2xl bg-white/12 border border-white/20 p-3.5 flex items-start gap-3">
              <img
                src={photoUrl || pgeaseIconColor}
                alt={selectedPg?.name || "Property"}
                className="h-14 w-14 rounded-2xl object-cover bg-white shrink-0 border border-white/25"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[16px] font-semibold truncate">{selectedPg?.name ?? "My PG"}</span>
                    {(selectedPg as any)?.isVerified && <CheckCircle2 className="h-4 w-4 text-white shrink-0" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[var(--ms-brand-800)] text-[11px] font-semibold shrink-0 cursor-pointer active:scale-95 transition-transform"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit PG</span>
                  </button>
                </div>
                <p className="text-[12px] text-white/80 truncate mt-0.5">{selectedPg?.address || "No address set"}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {selectedPg?.id && (
                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-medium">
                      ID: #{selectedPg.id.slice(0, 8)}
                    </span>
                  )}
                  <StatusChip label="Active" tone="success" />
                </div>
              </div>
            </div>
          }
        />
      }
    >
      <div className="px-4 -mt-3 space-y-5">
        {/* Phone & 4-Column Real Stats */}
        <MobileCard className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ms-ink)]">
              <Phone className="h-4 w-4 text-[var(--ms-brand-text)]" />
              {phone ? (
                <span>{phone}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-[var(--ms-brand-text)] font-semibold underline cursor-pointer"
                >
                  Add phone number
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Rooms", value: formatCount(summary.totalRooms), tone: "indigo" as IconTone, icon: <Building2 className="h-4 w-4" />, to: "/my-pgs/structure" },
              { label: "Beds", value: formatCount(summary.totalBeds), tone: "teal" as IconTone, icon: <BedDouble className="h-4 w-4" />, to: "/my-pgs/structure" },
              { label: "Facilities", value: formatCount(facilitiesCount), tone: "violet" as IconTone, icon: <Sparkles className="h-4 w-4" />, to: "/my-pgs/amenities" },
              { label: "Photos", value: formatCount(photosCount), tone: "rose" as IconTone, icon: <ImageIcon className="h-4 w-4" />, to: "/post-pg" },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate(s.to)}
                className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
              >
                <IconTile icon={s.icon} tone={s.tone} size="md" className="h-9 w-9" />
                <span className="text-[15px] font-semibold text-[var(--ms-ink)] tabular-nums">{s.value}</span>
                <span className="text-[11px] text-[var(--ms-ink-3)]">{s.label}</span>
              </button>
            ))}
          </div>
        </MobileCard>

        {/* PG Management */}
        <section className="space-y-2.5">
          <SectionHeader title="PG Management" />
          <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
            {managementItems.map((item) => (
              <ListRow
                key={item.title}
                tone={item.tone}
                icon={item.icon}
                title={item.title}
                subtitle={item.sub}
                onClick={() => navigate(item.to)}
              />
            ))}
          </MobileCard>
        </section>

        {/* PG Facilities */}
        <section className="space-y-2.5">
          <SectionHeader title="PG Facilities" />
          <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
            {facilityItems.map((item) => (
              <ListRow
                key={item.title}
                tone={item.tone}
                icon={item.icon}
                title={item.title}
                subtitle={item.sub}
                onClick={() => navigate(item.to)}
              />
            ))}
          </MobileCard>
        </section>

        {/* More for this PG */}
        <section className="space-y-2.5">
          <SectionHeader title="More for this PG" />
          <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
            {moreItems.map((item) => (
              <ListRow
                key={item.title}
                tone={item.tone}
                icon={item.icon}
                title={item.title}
                subtitle={item.sub}
                onClick={() => navigate(item.to)}
              />
            ))}
          </MobileCard>
        </section>
      </div>

      {/* Edit PG Bottom Sheet */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Property Details">
        <div className="space-y-3.5">
          <div>
            <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">PG Name</label>
            <input
              type="text"
              maxLength={100}
              value={pgName}
              onChange={(e) => setPgName(e.target.value)}
              className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px]"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">Address</label>
            <input
              type="text"
              maxLength={100}
              value={pgAddress}
              onChange={(e) => setPgAddress(e.target.value)}
              className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">PIN Code</label>
              <input
                type="text"
                maxLength={10}
                value={pgPin}
                onChange={(e) => setPgPin(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">Bed Range</label>
              <input
                type="text"
                maxLength={30}
                value={pgBedRange}
                onChange={(e) => setPgBedRange(e.target.value)}
                className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px]"
              />
            </div>
          </div>
          <PrimaryButton
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => void handleSave()}
            className="w-full"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </PrimaryButton>
        </div>
      </BottomSheet>
    </PageScaffold>
  );
}
