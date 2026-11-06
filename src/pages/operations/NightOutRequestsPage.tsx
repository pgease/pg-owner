import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Clock, MapPin, Moon, Plus, User, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/context/AppContext";
import { createNightOutRequest, getNightOutRequests } from "@/api/propertyOwner";
import { usePropertyTenants } from "@/hooks/usePropertyOwnerQueries";
import { CanAccessPage } from "@/components/PermissionGuard";
import { toast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FilterBar } from "@/components/common/FilterBar";
import { StatCard } from "@/components/common/StatCard";

export type MovementFilter = "all" | "currently_out" | "returned" | "upcoming";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DATE_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + index);
  const when = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const label = index === 0 ? `Today · ${when}` : index === 1 ? `Tomorrow · ${when}` : when;
  return { value: dateKey(date), label };
});

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${pad(hours)}:${minutes}`;
  const label = new Date(2026, 0, 1, hours, Number(minutes)).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { value, label };
});

function combineWhen(day: string, time: string): Date | null {
  if (!day || !time) return null;
  const date = new Date(`${day}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asList(value: unknown): any[] {
  let list: any[] = [];
  if (Array.isArray(value)) {
    list = value;
  } else {
    const record = value as { data?: unknown; requests?: unknown; tenants?: unknown } | null;
    if (Array.isArray(record?.data)) list = record.data;
    else if (Array.isArray(record?.requests)) list = record.requests;
    else if (Array.isArray(record?.tenants)) list = record.tenants;
  }
  return list.map((item) => {
    if (item && item.request && typeof item.request === "object") {
      return {
        ...item.request,
        id: item.request.id || item.id,
        tenant: item.tenant || item.request.tenant,
        room: item.room || item.request.room,
        tenantName: item.tenant?.name || item.request.tenantName || item.request.tenant?.name,
        tenantPhone: item.tenant?.phone || item.request.tenantPhone || item.request.tenant?.phone,
        roomNumber: item.room?.roomNumber || item.request.roomNumber || item.request.room?.roomNumber,
        floorName: item.floorName || item.request.floorName,
        blockName: item.blockName || item.request.blockName,
      };
    }
    return item;
  });
}

function getMovementState(req: any): "away" | "upcoming" | "returned" {
  const now = Date.now();
  const leave = req.leaveDate || req.fromDate;
  const ret = req.returnDate || req.toDate;
  const leaveTs = leave ? new Date(leave).getTime() : 0;
  const retTs = ret ? new Date(ret).getTime() : 0;

  if (retTs && now > retTs) {
    return "returned";
  }
  if (leaveTs && now < leaveTs) {
    return "upcoming";
  }
  return "away"; // resident is currently away tonight
}

function formatWhen(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function tenantName(req: any): string {
  if (!req) return "This tenant";
  return req.tenantName || req.tenant?.name || req.tenant?.fullName || "Tenant";
}

function roomLabel(req: any): string {
  const room = req.roomNumber || req.room?.roomNumber;
  return room ? `Room ${room}` : "Room not set";
}

export default function NightOutRequestsPage() {
  const { selectedPgId, properties } = useApp();
  const queryClient = useQueryClient();
  const selectedPg = properties.find((p) => p.id === selectedPgId);

  const [movementFilter, setMovementFilter] = useState<MovementFilter>("all");
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [leaveDay, setLeaveDay] = useState("");
  const [leaveTime, setLeaveTime] = useState("");
  const [returnDay, setReturnDay] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [reason, setReason] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [contactDuringStay, setContactDuringStay] = useState("");
  const [parentConsentConfirmed, setParentConsentConfirmed] = useState(false);

  const { data: tenantsData = [] } = usePropertyTenants(selectedPgId);
  const tenantsList = asList(tenantsData);

  const requestsQuery = useQuery({
    queryKey: ["nightOutRequests", selectedPgId],
    queryFn: () => (selectedPgId ? getNightOutRequests(selectedPgId) : null),
    enabled: Boolean(selectedPgId),
  });

  const createNightOutMutation = useMutation({
    mutationFn: async () => {
      const leaveAt = combineWhen(leaveDay, leaveTime);
      const returnAt = combineWhen(returnDay, returnTime);
      if (!selectedPgId || !selectedTenantId || !leaveAt || !returnAt) return;
      const stayPhone = contactDuringStay.replace(/\D/g, "");
      if (stayPhone && stayPhone.length !== 10) {
        throw new Error("Stay contact must be a 10-digit mobile number.");
      }
      return createNightOutRequest(selectedPgId, {
        tenantId: selectedTenantId,
        leaveDate: leaveAt.toISOString(),
        returnDate: returnAt.toISOString(),
        reason: reason.trim() || undefined,
        destinationAddress: destinationAddress.trim() || undefined,
        contactDuringStay: contactDuringStay.trim() || undefined,
        parentConsentConfirmed: parentConsentConfirmed,
      });
    },
    onSuccess: () => {
      toast({ title: "Night out entry recorded", description: "Saved and logged in movement register." });
      setAddOpen(false);
      setSelectedTenantId("");
      setLeaveDay("");
      setLeaveTime("");
      setReturnDay("");
      setReturnTime("");
      setReason("");
      setDestinationAddress("");
      setContactDuringStay("");
      setParentConsentConfirmed(false);
      queryClient.invalidateQueries({ queryKey: ["nightOutRequests", selectedPgId] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Couldn't record entry",
        description: error instanceof Error ? error.message : "Check the details and try again.",
        variant: "destructive",
      });
    },
  });

  const requests = asList(requestsQuery.data);

  const counts = useMemo(() => {
    return requests.reduce(
      (acc, req) => {
        const state = getMovementState(req);
        if (state === "away") acc.currentlyOut += 1;
        else if (state === "returned") acc.returned += 1;
        else if (state === "upcoming") acc.upcoming += 1;
        return acc;
      },
      { currentlyOut: 0, returned: 0, upcoming: 0 }
    );
  }, [requests]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((req) => {
      const state = getMovementState(req);
      if (movementFilter === "currently_out" && state !== "away") return false;
      if (movementFilter === "returned" && state !== "returned") return false;
      if (movementFilter === "upcoming" && state !== "upcoming") return false;
      if (!q) return true;
      return [tenantName(req), roomLabel(req), req.reason, req.destinationAddress].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [requests, search, movementFilter]);

  const leaveAt = combineWhen(leaveDay, leaveTime);
  const returnAt = combineWhen(returnDay, returnTime);
  const returnIsAfterLeave = Boolean(leaveAt && returnAt && returnAt > leaveAt);
  const canIssue = Boolean(selectedTenantId && returnIsAfterLeave);

  return (
    <CanAccessPage permission="nightout_view">
      <div className="space-y-6 pb-12 animate-fade-in">
        <PageHeader
          title="Night Out Movement Register"
          description={selectedPg ? `Resident night out departure and movement register for ${selectedPg.name}.` : "Resident night out departure register."}
          actions={
            <Button className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold" onClick={() => setAddOpen(true)} disabled={!selectedPgId}>
              <Plus className="h-4 w-4" /> Record Night Out
            </Button>
          }
        />

        {!selectedPgId ? (
          <EmptyState icon={<Building2 className="h-6 w-6" />} title="Select a property" description="Choose a PG to view night out logs." />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Total Intimations"
                value={requestsQuery.isLoading ? "—" : requests.length}
                tone="default"
                icon={<Moon className="h-4 w-4 text-indigo-600" />}
                hint="Total night out movement records"
              />
              <StatCard
                label="Currently Out Tonight"
                value={requestsQuery.isLoading ? "—" : counts.currentlyOut}
                tone={counts.currentlyOut > 0 ? "warning" : "default"}
                icon={<LogOut className="h-4 w-4 text-amber-600" />}
                hint="Residents away right now"
              />
              <StatCard
                label="Returned / Completed"
                value={requestsQuery.isLoading ? "—" : counts.returned}
                tone="success"
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                hint="Past night out movements"
              />
            </div>

            {/* Filter Bar */}
            <FilterBar
              activeCount={(movementFilter === "all" ? 0 : 1) + (search.trim() ? 1 : 0)}
              onReset={() => {
                setMovementFilter("all");
                setSearch("");
              }}
            >
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant, room, or reason"
                aria-label="Search night out movement logs"
                className="h-9 w-full sm:max-w-xs"
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by movement status">
                {[
                  { key: "all", label: `All Logs (${requests.length})` },
                  { key: "currently_out", label: `Currently Out (${counts.currentlyOut})` },
                  { key: "upcoming", label: `Upcoming (${counts.upcoming})` },
                  { key: "returned", label: `Returned / Completed (${counts.returned})` },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={movementFilter === key ? "default" : "outline"}
                    onClick={() => setMovementFilter(key as any)}
                    className={movementFilter === key ? "bg-teal-600 text-white hover:bg-teal-700" : ""}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </FilterBar>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {requestsQuery.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : requestsQuery.isError ? (
                <ErrorState
                  title="Couldn't load night out logs"
                  description="Records didn't load. Try again."
                  onRetry={() => void requestsQuery.refetch()}
                  retrying={requestsQuery.isFetching}
                />
              ) : visible.length === 0 ? (
                <EmptyState
                  icon={<Moon className="h-6 w-6" />}
                  title={requests.length === 0 ? "No night out movements recorded" : "No intimations match these filters"}
                  description={requests.length === 0 ? "Night out entries from residents will appear here automatically when submitted from the app." : "Clear the search or status filter to see every record."}
                  action={
                    requests.length === 0 ? (
                      <Button className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setAddOpen(true)}>
                        <Plus className="h-4 w-4" /> Record Night Out
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {visible.map((req: any, idx: number) => {
                    const movementState = getMovementState(req);
                    const leave = req.leaveDate || req.fromDate;
                    const leaveDate = leave ? new Date(leave) : null;
                    const dayNum = leaveDate && !Number.isNaN(leaveDate.getTime()) ? leaveDate.getDate() : "—";
                    const month = leaveDate && !Number.isNaN(leaveDate.getTime()) ? leaveDate.toLocaleDateString("en-IN", { month: "short" }) : "";
                    const tenantPhone = req.tenant?.phone || req.phone;

                    return (
                      <li key={req.id || req._id || idx} className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Left section with Date avatar & main info */}
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            {/* Date badge */}
                            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <span className="text-xl font-bold leading-none tabular-nums">{dayNum}</span>
                              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{month}</span>
                            </div>

                            {/* Main Details */}
                            <div className="min-w-0 flex-1 space-y-2">
                              {/* Header: Name, Phone, Room */}
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                  <User className="h-4 w-4 text-teal-600" />
                                  {tenantName(req)}
                                </p>
                                {tenantPhone && (
                                  <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    {tenantPhone}
                                  </span>
                                )}
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                                  {roomLabel(req)}
                                </span>
                              </div>

                              {/* Timings & Destination */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5 font-medium bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-200/60 dark:border-slate-800">
                                  <Clock className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                                  <span>{formatWhen(leave)} → {formatWhen(req.returnDate || req.toDate)}</span>
                                </div>
                                {(req.destinationAddress || req.destination) && (
                                  <div className="flex items-center gap-1.5 bg-amber-50/60 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-md border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                                    <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                    <span className="truncate">Destination: <strong>{req.destinationAddress || req.destination}</strong></span>
                                  </div>
                                )}
                              </div>

                              {/* Reason Box */}
                              <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-200">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">Reason: </span>
                                {req.reason || req.purpose || "No specific reason provided"}
                              </div>

                              {/* Contact & Parent Informed Status Row */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                                {req.contactDuringStay && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 font-medium">
                                    <span>📞 Stay Contact:</span> <strong>{req.contactDuringStay}</strong>
                                  </span>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                                  req.parentConsentConfirmed
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                    : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                }`}>
                                  {req.parentConsentConfirmed ? "✓ Parent / Guardian Informed" : "Parent Not Informed"}
                                </span>
                              </div>

                              {/* Notes if present */}
                              {req.ownerRemarks && (
                                <div className="rounded-md bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 p-2 text-xs text-teal-900 dark:text-teal-200">
                                  <span className="font-bold">Note: </span>
                                  {req.ownerRemarks}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side: Movement Status Badge (No manual clicking required) */}
                          <div className="shrink-0 flex items-center md:items-start pt-1">
                            {movementState === "away" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                <Moon className="h-3.5 w-3.5 text-amber-600" />
                                Currently Away
                              </span>
                            )}
                            {movementState === "upcoming" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
                                <Clock className="h-3.5 w-3.5 text-blue-600" />
                                Upcoming Departure
                              </span>
                            )}
                            {movementState === "returned" && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Returned / Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Modal: Record Night Out on Behalf of Tenant */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-teal-600" />
                Record Night Out Intimation
              </DialogTitle>
              <DialogDescription>
                Log a resident's night out entry on their behalf.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="nightout-tenant">Resident Tenant</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger id="nightout-tenant">
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name || tenant.fullName || "Tenant"}
                        {tenant.roomNumber || tenant.room?.roomNumber ? ` · Room ${tenant.roomNumber || tenant.room?.roomNumber}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label id="nightout-leave-label">Departure Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={leaveDay || undefined} onValueChange={setLeaveDay}>
                    <SelectTrigger id="nightout-leave-date" aria-labelledby="nightout-leave-label">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={leaveTime || undefined} onValueChange={setLeaveTime}>
                    <SelectTrigger id="nightout-leave-time" aria-label="Leave time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={`leave-${option.value}`} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label id="nightout-return-label">Expected Return Date & Time</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={returnDay || undefined} onValueChange={setReturnDay}>
                    <SelectTrigger id="nightout-return-date" aria-labelledby="nightout-return-label">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={returnTime || undefined} onValueChange={setReturnTime}>
                    <SelectTrigger id="nightout-return-time" aria-label="Return time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((option) => (
                        <SelectItem key={`return-${option.value}`} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nightout-destination">Destination / Hometown Address</Label>
                <Input
                  id="nightout-destination"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="e.g. Sector 62 Noida, Parents Home Jaipur"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nightout-contact">Stay Contact Number</Label>
                <Input
                  id="nightout-contact"
                  type="tel"
                  maxLength={10}
                  value={contactDuringStay}
                  onChange={(e) => setContactDuringStay(e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nightout-reason">Reason for Leaving</Label>
                <Input
                  id="nightout-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Weekend hometown visit, Family function"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="nightout-parent-consent"
                  checked={parentConsentConfirmed}
                  onChange={(e) => setParentConsentConfirmed(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor="nightout-parent-consent" className="text-xs font-normal cursor-pointer">
                  Parent or guardian has been informed of departure
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                onClick={() => createNightOutMutation.mutate()}
                disabled={!canIssue || createNightOutMutation.isPending}
              >
                {createNightOutMutation.isPending ? "Saving…" : "Save Night Out Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
