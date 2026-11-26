import React, { useState } from "react";
import { Building2, IndianRupee, Plus, ShieldCheck, Users } from "lucide-react";
import {
  Avatar,
  BottomSheet,
  ConfirmDialog,
  DangerButton,
  ExtendedFAB,
  FilterChips,
  ListRow,
  MobileCard,
  MoneyText,
  OccupancyRing,
  OutlineButton,
  PrimaryButton,
  SectionHeader,
  SegmentedTabs,
  SwipeTabs,
  SkeletonBlock,
  StatTile,
  StatusChip,
} from "@/mobile/components/ui/Primitives";
import { MascotEmptyState, MascotErrorState, OfflineBanner } from "@/mobile/components/ui/MascotStates";
import { MobileSubHeader } from "@/mobile/components/ui/MobileHeaders";

export default function GalleryPage() {
  const [chip, setChip] = useState("all");
  const [tab, setTab] = useState("recent");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="ms-shell min-h-dvh pb-24">
      <MobileSubHeader title="UI Component Gallery" subtitle="Dev-only Phase 1 Foundations" />

      <div className="p-4 space-y-5 max-w-md mx-auto">
        <OfflineBanner lastUpdated="12:40" onRetry={() => {}} />

        <MobileCard className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-[var(--ms-ink-3)]">Total Tenants</div>
              <div className="text-[28px] font-semibold leading-tight">11</div>
              <div className="text-[12px] text-[var(--ms-ink-3)]">across 27 total beds</div>
            </div>
            <OccupancyRing pct={41} />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip label="KYC Pending" tone="pending" />
            <StatusChip label="Pro Plan" tone="teal" />
            <StatusChip label="Paid" tone="success" />
            <StatusChip label="Overdue" tone="error" />
          </div>
        </MobileCard>

        <div className="grid grid-cols-2 gap-3">
          <StatTile icon={<IndianRupee className="h-5 w-5" />} value={<MoneyText amount={500169} compact />} label="Monthly Revenue" onClick={() => {}} />
          <StatTile icon={<Users className="h-5 w-5" />} value={11} label="Occupied Beds" onClick={() => {}} />
        </div>

        <SectionHeader title="Actions & Filters" actionLabel="Open Sheet" onAction={() => setSheetOpen(true)} />
        <FilterChips
          items={[
            { id: "all", label: "All" },
            { id: "cash", label: "Cash" },
            { id: "upi", label: "UPI" },
          ]}
          value={chip}
          onChange={setChip}
        />
        <SwipeTabs
          tabs={[
            { id: "recent", label: "Recent" },
            { id: "register", label: "Register", badge: 4 },
            { id: "dues", label: "Dues" },
          ]}
          value={tab}
          onChange={setTab}
        />

        <MobileCard className="p-0 overflow-hidden divide-y divide-[var(--ms-divider)]">
          <ListRow icon={<Building2 className="h-5 w-5" />} title="PG Layout Management" subtitle="Manage blocks, floors & beds" onClick={() => {}} />
          <ListRow icon={<ShieldCheck className="h-5 w-5" />} title="KYC & Credits" subtitle="4 Credits remaining" onClick={() => {}} />
        </MobileCard>

        <div className="flex items-center gap-3">
          <Avatar name="Shivam PG" />
          <PrimaryButton onClick={() => setSheetOpen(true)}>Primary</PrimaryButton>
          <OutlineButton onClick={() => setDialogOpen(true)}>Dialog</OutlineButton>
          <DangerButton onClick={() => setDialogOpen(true)}>Danger</DangerButton>
        </div>

        <SkeletonBlock className="h-14 w-full" />

        <MascotEmptyState
          variant="empty"
          size="md"
          title="No tenants yet"
          message="Tap the button below to add your first tenant"
          actionLabel="+ Add Tenant"
          onAction={() => {}}
        />

        <MascotErrorState onRetry={() => {}} />
      </div>

      <ExtendedFAB icon={<Plus className="h-5 w-5" />} label="Add Tenant" onClick={() => setSheetOpen(true)} className="bottom-6" />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Sample Bottom Sheet">
        <p className="text-[13px] text-[var(--ms-ink-2)] mb-4">All tokens & safe-area insets applied.</p>
        <PrimaryButton className="w-full" onClick={() => setSheetOpen(false)}>Close</PrimaryButton>
      </BottomSheet>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        onConfirm={() => {}}
      />
    </div>
  );
}
