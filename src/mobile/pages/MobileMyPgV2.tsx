import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban,
  BedDouble,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck2,
  Globe,
  Image as ImageIcon,
  Landmark,
  MapPin,
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
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import {
  AddressFields,
  composeStructuredAddress,
  isValidIndianPin,
  splitLegacyAddress,
  type StructuredAddressValue,
} from "@/mobile/components/ui/AddressFields";
import { toast } from "@/components/ui/use-toast";

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
  const [pgBedRange, setPgBedRange] = useState("");
  const [addrValue, setAddrValue] = useState<StructuredAddressValue>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pin: "",
  });
  const [pinConflictHint, setPinConflictHint] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StructuredAddressValue | "pgName", string>>>({});

  useEffect(() => {
    if (!selectedPg) return;
    setPgName(selectedPg.name || "");
    setPgBedRange(selectedPg.bedRange ?? "50-100");
    const split = splitLegacyAddress(selectedPg.address, selectedPg.locationPin);
    setAddrValue({
      line1: split.line1,
      line2: split.line2,
      city: split.city,
      state: split.state,
      pin: split.pin,
    });
    setPinConflictHint(split.pinConflict);
    setFormErrors({});
  }, [selectedPg]);

  const handleSave = async () => {
    if (isOffline) {
      toast({ title: "You're offline", description: "Connect to the internet to update property details." });
      return;
    }
    if (!selectedPgId || !selectedPg) return;

    const errs: Partial<Record<keyof StructuredAddressValue | "pgName", string>> = {};
    if (!pgName.trim()) errs.pgName = "PG Name is required";
    if (!addrValue.line1.trim()) errs.line1 = "Address Line 1 is required";
    if (!addrValue.city.trim()) errs.city = "City is required";
    if (!addrValue.state.trim()) errs.state = "State is required";
    if (!isValidIndianPin(addrValue.pin)) errs.pin = "Enter a valid 6-digit PIN code";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const composedAddress = composeStructuredAddress(addrValue);
    try {
      await updateMutation.mutateAsync({
        propertyId: selectedPgId,
        payload: {
          name: pgName.trim(),
          address: composedAddress,
          locationPin: addrValue.pin.trim(),
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
      header={<MobileAppHeader title="My Property" />}
    >
      <div className="px-4 pt-3 space-y-5">
        {/* B.1: Single Compact Property Card (<= 220px, no duplicated PG name/photo) */}
        <MobileCard className="p-3.5 space-y-3">
          {/* Row 1: Status + Copyable ID + Edit PG */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <StatusChip label="Active" tone="success" />
              {selectedPg?.id && (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(selectedPg.id);
                    toast({ title: "Copied", description: `PG ID #${selectedPg.id.slice(0, 8)} copied.` });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ms-page)] border border-[var(--ms-border)] text-[11px] font-medium text-[var(--ms-ink-2)] cursor-pointer active:scale-95"
                >
                  <span>#{selectedPg.id.slice(0, 8)}</span>
                  <Copy className="h-3 w-3 text-[var(--ms-ink-3)]" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[var(--ms-border)] bg-[var(--ms-page)] text-[var(--ms-ink)] text-[11.5px] font-semibold shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <Pencil className="h-3 w-3 text-[var(--ms-brand-text)]" />
              <span>Edit PG</span>
            </button>
          </div>

          {/* Row 2: Phone */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--ms-ink)]">
            <IconTile icon={<Phone className="h-3.5 w-3.5" />} tone="teal" size="sm" className="h-7 w-7 rounded-lg" />
            {phone ? (
              <span className="truncate">{phone}</span>
            ) : (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="text-[var(--ms-brand-text)] font-semibold underline cursor-pointer"
              >
                Add phone
              </button>
            )}
          </div>

          {/* Row 3: Full Address (max 2 lines) */}
          <div className="flex items-start gap-2 text-[12px] text-[var(--ms-ink-2)]">
            <IconTile icon={<MapPin className="h-3.5 w-3.5" />} tone="blue" size="sm" className="h-7 w-7 rounded-lg mt-0.5" />
            <p className="line-clamp-2 leading-snug flex-1">{selectedPg?.address || "No address set"}</p>
          </div>

          {/* Row 4: 4 Stat Tiles */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[var(--ms-divider)] text-center">
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
                className="flex flex-col items-center gap-0.5 py-1 cursor-pointer active:scale-95 transition-transform"
              >
                <IconTile icon={s.icon} tone={s.tone} size="md" className="h-8 w-8" />
                <span className="text-[14px] font-semibold text-[var(--ms-ink)] tabular-nums">{s.value}</span>
                <span className="text-[10.5px] text-[var(--ms-ink-3)]">{s.label}</span>
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

      {/* B.2 & C: Full-height Edit PG Bottom Sheet with Structured Address */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Property Details"
        fullHeight
        footer={
          <div className="grid grid-cols-2 gap-3">
            <OutlineButton type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              type="button"
              disabled={updateMutation.isPending}
              onClick={() => void handleSave()}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-3.5 pb-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">PG Name *</label>
              <span className="text-[11px] text-[var(--ms-ink-3)] tabular-nums">{pgName.length}/100</span>
            </div>
            <input
              type="text"
              maxLength={100}
              value={pgName}
              onChange={(e) => setPgName(e.target.value.slice(0, 100))}
              className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
            />
            {formErrors.pgName && <p className="mt-1 text-[11px] text-[var(--ms-error)]">{formErrors.pgName}</p>}
          </div>

          <AddressFields
            value={addrValue}
            onChange={setAddrValue}
            pinConflictHint={pinConflictHint}
            errors={formErrors}
          />

          <div>
            <label className="text-[12px] font-medium text-[var(--ms-ink-2)]">Bed Range</label>
            <input
              type="text"
              maxLength={30}
              value={pgBedRange}
              onChange={(e) => setPgBedRange(e.target.value)}
              placeholder="e.g. 50-100"
              className="mt-1 w-full h-11 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-page)] px-3 text-[14px] text-[var(--ms-ink)]"
            />
          </div>
        </div>
      </BottomSheet>
    </PageScaffold>
  );
}
