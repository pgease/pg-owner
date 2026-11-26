import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Layers,
  DoorOpen,
  BedDouble,
  Plus,
  Loader2,
  Trash2,
  Users,
  Grid3X3,
  Table as TableIcon,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Package,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "@/components/ui/use-toast";
import {
  useBlocks,
  useCreateBlock,
  useCreateFloor,
  useCreateRoom,
  useFloors,
  useRoomsList,
  usePropertyTenants,
  useDeleteBlockMutation,
  useDeleteFloorMutation,
  useDeleteRoomMutation,
} from "@/hooks/usePropertyOwnerQueries";
import { createProperty, updateRoom } from "@/api/propertyOwner";
import { CanAccessPage } from "@/components/PermissionGuard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { TrialExpiredGateModal } from "@/components/common/TrialExpiredGateModal";
import { RoomInventoryDrawer } from "@/components/inventory/RoomInventoryDrawer";
import { cn } from "@/lib/utils";

function floorSortKey(name: string): number {
  const text = name.toLowerCase();
  if (text.includes("ground") || text === "g" || text.includes("gf")) return 0;
  const match = text.match(/(\d+)/);
  return match ? Number(match[1]) : 99;
}

export default function Structure() {
  const { selectedPgId, properties, refreshProperties, setSelectedPgId } = useApp();
  const currentPropertyId = selectedPgId;
  const propertyList = properties;
  const setCurrentPropertyId = setSelectedPgId;
  const navigate = useNavigate();

  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [inventoryRoom, setInventoryRoom] = useState<any>(null);
  const [invRefreshTick, setInvRefreshTick] = useState(0);

  const roomTplMap = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`pgease_inv_room_tpl_map_${currentPropertyId}`) || '{}');
    } catch {
      return {};
    }
  }, [currentPropertyId, invRefreshTick]);

  const getRoomTplName = (roomId: string) => {
    const tplId = roomTplMap[roomId];
    if (!tplId) return null;
    return tplId.replace('tpl_', '').replace(/_/g, ' ');
  };

  const entitlements = useEntitlements();
  const [trialExpiredOpen, setTrialExpiredOpen] = useState(false);
  const [trialExpiredFeature, setTrialExpiredFeature] = useState("");

  const handleOpenAddProperty = () => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Add Property");
      setTrialExpiredOpen(true);
      return;
    }
    setAddPropertyOpen(true);
  };

  const handleOpenAddFloor = () => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Add Floor");
      setTrialExpiredOpen(true);
      return;
    }
    setAddFloorOpen(true);
  };

  const handleOpenAddRoom = () => {
    if (entitlements.isExpired) {
      setTrialExpiredFeature("Add Room");
      setTrialExpiredOpen(true);
      return;
    }
    if (entitlements.isBedQuotaFull) {
      toast({
        title: "Bed Quota Exceeded",
        description: `Your subscription limit of ${entitlements.bedsUsage?.max || 0} beds has been reached. Please upgrade your plan to add more rooms and beds.`,
        variant: "destructive",
      });
      navigate("/plans");
      return;
    }
    setAddRoomOpen(true);
  };

  // State for Navigation Hierarchy
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");

  // Modals state
  const [addPropertyOpen, setAddPropertyOpen] = useState(false);
  const [addBlockOpen, setAddBlockOpen] = useState(false);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  // Forms
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactNumber: "",
    totalFloors: 0,
    totalRooms: 0,
    totalBeds: 0,
  });

  const [blockName, setBlockName] = useState("");
  const [floorName, setFloorName] = useState("");
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    numberOfBeds: 2,
  });

  // OW-16: Room master editing
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [editRoomForm, setEditRoomForm] = useState({
    roomNumber: "",
    floorId: "",
    numberOfBeds: 2,
    rentPerBed: 0,
    acType: "NON_AC",
    hasAttachedBathroom: false,
    hasBalcony: false,
    hasElectricityMeter: false,
    meterNumber: "",
    notes: "",
  });

  const updateRoomMut = useMutation({
    mutationFn: ({ roomId, payload }: { roomId: string; payload: any }) => {
      if (!currentPropertyId) throw new Error("Select a PG property");
      return updateRoom(currentPropertyId, roomId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property", currentPropertyId, "rooms-list"] });
      queryClient.invalidateQueries({ queryKey: ["property", currentPropertyId, "all-rooms-counts"] });
      toast({ title: "Room Updated", description: "Room master details saved successfully." });
      setEditRoomOpen(false);
      setEditingRoom(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to update room", description: err?.message, variant: "destructive" });
    },
  });

  const handleOpenEditRoom = (r: any) => {
    setEditingRoom(r);
    setEditRoomForm({
      roomNumber: String(r.roomNumber || ""),
      floorId: String(r.floorId || effectiveFloorId || ""),
      numberOfBeds: Number(r.numberOfBeds || r.capacity || 2),
      rentPerBed: Number(r.rentPerBed || r.monthlyRent || 0),
      acType: r.acType || (r.isAc ? "AC" : "NON_AC"),
      hasAttachedBathroom: Boolean(r.hasAttachedBathroom || r.hasAttachedBath),
      hasBalcony: Boolean(r.hasBalcony),
      hasElectricityMeter: Boolean(r.hasElectricityMeter),
      meterNumber: String(r.meterNumber || ""),
      notes: String(r.notes || ""),
    });
    setEditRoomOpen(true);
  };

  // Queries
  const blocksQuery = useBlocks(currentPropertyId);
  const rawBlocks = blocksQuery.data ?? [];

  // Query all rooms across property without requiring strict block/floor IDs
  const allRoomsQuery = useRoomsList(currentPropertyId, undefined, undefined, { requireBlockAndFloor: false });
  const allRooms = allRoomsQuery.data ?? [];

  // P0 Bug 4: If blocks table is empty but rooms exist, synthesize blocks from room data
  const blocks = useMemo(() => {
    if (rawBlocks.length > 0) return rawBlocks;
    if (allRooms.length === 0) return [];

    // Synthesize unique blocks from rooms
    const blockNames = new Set<string>();
    allRooms.forEach((r: any) => {
      const b = r.block || r.blockName || (r.blockId ? `Block ${r.blockId}` : "Main Wing");
      blockNames.add(b);
    });

    return Array.from(blockNames).map((name, idx) => ({
      id: `synth-block-${idx}`,
      name,
      propertyId: currentPropertyId || "",
    }));
  }, [rawBlocks, allRooms, currentPropertyId]);

  const effectiveBlockId = selectedBlockId || blocks[0]?.id || "";
  const floorsQuery = useFloors(currentPropertyId, effectiveBlockId && !effectiveBlockId.startsWith("synth-") ? effectiveBlockId : undefined);
  const rawFloors = floorsQuery.data ?? [];

  // Synthesize floors if needed
  const floors = useMemo(() => {
    const byRank = (a: { name?: string; floorNumber?: number | null }, b: { name?: string; floorNumber?: number | null }) =>
      floorSortKey(String(a.floorNumber ?? a.name ?? "")) - floorSortKey(String(b.floorNumber ?? b.name ?? ""));
    if (rawFloors.length > 0) return [...rawFloors].sort(byRank);
    if (allRooms.length === 0) return [];

    const floorNames = new Set<string>();
    allRooms.forEach((r: any) => {
      const f = r.floor || r.floorName || (r.floorNumber != null ? `Floor ${r.floorNumber}` : "Ground Floor");
      floorNames.add(f);
    });

    return Array.from(floorNames)
      .sort((a, b) => floorSortKey(a) - floorSortKey(b))
      .map((name, idx) => ({
      id: `synth-floor-${idx}`,
      name,
      blockId: effectiveBlockId,
      propertyId: currentPropertyId || "",
      displayOrder: idx + 1,
    }));
  }, [rawFloors, allRooms, effectiveBlockId, currentPropertyId]);

  const effectiveFloorId = selectedFloorId || floors[0]?.id || "";

  // Rooms Query: filter strictly by selected block and floor (unless synthetic); track legacy unassigned rooms
  const unassignedRooms = useMemo(
    () => allRooms.filter((r: any) => !r.blockId && !r.floorId),
    [allRooms]
  );

  const rooms = useMemo(() => {
    if (effectiveBlockId.startsWith("synth-") || effectiveFloorId.startsWith("synth-")) {
      return allRooms;
    }
    if (!effectiveBlockId || !effectiveFloorId) return [];
    return allRooms.filter((r: any) => {
      const matchBlock = !r.blockId || r.blockId === effectiveBlockId;
      const matchFloor = r.floorId === effectiveFloorId;
      return matchBlock && matchFloor;
    });
  }, [allRooms, effectiveBlockId, effectiveFloorId]);

  const { data: tenantsData = [] } = usePropertyTenants(currentPropertyId);

  // Mutations
  const createBlockMut = useCreateBlock(currentPropertyId);
  const createFloorMut = useCreateFloor(currentPropertyId, effectiveBlockId && !effectiveBlockId.startsWith("synth-") ? effectiveBlockId : undefined);
  const createRoomMut = useCreateRoom(currentPropertyId);

  const deleteBlockMut = useDeleteBlockMutation(currentPropertyId);
  const deleteFloorMut = useDeleteFloorMutation(currentPropertyId);
  const deleteRoomMut = useDeleteRoomMutation(currentPropertyId);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "block" | "floor" | "room";
    id: string;
    name: string;
  }>({ open: false, type: "block", id: "", name: "" });

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === "block") {
        await deleteBlockMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Block deleted", description: `${deleteConfirm.name} removed.` });
        if (selectedBlockId === deleteConfirm.id) setSelectedBlockId("");
      } else if (deleteConfirm.type === "floor") {
        await deleteFloorMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Floor deleted", description: `${deleteConfirm.name} removed.` });
        if (selectedFloorId === deleteConfirm.id) setSelectedFloorId("");
      } else if (deleteConfirm.type === "room") {
        await deleteRoomMut.mutateAsync(deleteConfirm.id);
        toast({ title: "Room deleted", description: `${deleteConfirm.name} removed.` });
      }
    } catch (e: any) {
      toast({
        title: "Could not delete",
        description: e?.message || "Ensure no active tenants occupy this room before deleting.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirm({ open: false, type: "block", id: "", name: "" });
    }
  };

  const activeProperty = propertyList.find((p) => p.id === currentPropertyId);

  // Handlers
  const handleCreateProperty = async () => {
    if (!propertyForm.name.trim()) {
      toast({ title: "Please enter property name", variant: "destructive" });
      return;
    }
    try {
      const res = await createProperty({
        name: propertyForm.name.trim(),
        address: `${propertyForm.address.trim()}, ${propertyForm.city.trim()}, ${propertyForm.state.trim()}`,
        latitude: 28.63876539,
        longitude: 77.37794469,
        locationPin: propertyForm.pincode.trim() || "201014",
        bedRange: `${Number(propertyForm.totalBeds || 10)}-${Number(propertyForm.totalBeds || 10) + 20}`,
        propertyTypeId: "770b22ea-688a-481a-9ee3-006e6891600f",
      });
      toast({ title: "Property created", description: `${propertyForm.name} added successfully.` });
      setAddPropertyOpen(false);
      await refreshProperties();
      if (res?.id) setCurrentPropertyId(res.id);
    } catch (e: any) {
      toast({ title: "Failed to create property", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateBlock = async () => {
    if (!blockName.trim()) {
      toast({ title: "Please enter block name", variant: "destructive" });
      return;
    }
    try {
      await createBlockMut.mutateAsync({ name: blockName.trim() });
      toast({ title: "Block added", description: `${blockName} created successfully.` });
      setBlockName("");
      setAddBlockOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create block", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateFloor = async () => {
    if (!floorName.trim() || !effectiveBlockId) {
      toast({ title: "Please enter floor name", variant: "destructive" });
      return;
    }
    try {
      await createFloorMut.mutateAsync({
        name: floorName.trim(),
        displayOrder: floors.length + 1,
      });
      toast({ title: "Floor added", description: `${floorName} added to block.` });
      setFloorName("");
      setAddFloorOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create floor", description: e?.message, variant: "destructive" });
    }
  };

  const handleCreateRoom = async () => {
    if (!roomForm.roomNumber.trim()) {
      toast({ title: "Enter room number", variant: "destructive" });
      return;
    }
    try {
      await createRoomMut.mutateAsync({
        floorId: effectiveFloorId && !effectiveFloorId.startsWith("synth-") ? effectiveFloorId : undefined,
        roomNumber: roomForm.roomNumber.trim(),
        numberOfBeds: Number(roomForm.numberOfBeds),
      });
      toast({
        title: "Room created",
        description: `Room ${roomForm.roomNumber} with ${roomForm.numberOfBeds} beds created.`,
      });
      setRoomForm({ roomNumber: "", numberOfBeds: 2 });
      setAddRoomOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to create room", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <CanAccessPage permission="multi_pg">
      <div className="space-y-6 pb-12 max-w-7xl">
        {/* Page Header */}
        <PageHeader
          title="Rooms & Beds"
          description="Follow PG → Block → Floor → Room to organize your property layout and bed occupancy."
        />

        {/* 4-Step Flow Indicator: PG -> Block -> Floor -> Room */}
        <div className="register-card px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
          {[
            { label: "1. PG", done: Boolean(currentPropertyId), active: !currentPropertyId },
            { label: "2. Block", done: blocks.length > 0, active: Boolean(currentPropertyId) && blocks.length === 0 },
            { label: "3. Floor", done: floors.length > 0, active: blocks.length > 0 && floors.length === 0 },
            { label: "4. Room", done: rooms.length > 0, active: floors.length > 0 && rooms.length === 0 },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.label}>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium",
                  step.done
                    ? "bg-[#E6F3F3] text-[#005F5F]"
                    : step.active
                      ? "bg-[#008080] text-white font-semibold"
                      : "bg-[var(--gray-100)] text-[var(--gray-500)]"
                )}
              >
                {step.done && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>{step.label}</span>
              </span>
              {idx < arr.length - 1 && <span className="text-[var(--gray-400)]">→</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Property & View Switcher Bar (Single PG switcher in top-left header only) */}
        <div className="register-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-md bg-[var(--brand-50)] border border-[var(--brand-100)] text-[var(--brand-700)] flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-md font-semibold text-[var(--gray-900)] truncate">
                  {activeProperty?.name || "Select Property"}
                </h2>
                <span className="text-[11px] font-medium text-[var(--gray-500)] bg-[var(--gray-100)] px-2 py-0.5 rounded-sm shrink-0">
                  {allRooms.length} rooms
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)] mt-0.5 truncate">
                {activeProperty?.address || "Configure room blocks and bed capacity"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* View Mode Toggle: Bed Grid vs Table */}
            <div className="hidden sm:flex rounded-md border border-[var(--gray-300)] p-0.5 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer",
                  viewMode === "grid"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)]"
                )}
              >
                <Grid3X3 className="h-3.5 w-3.5" /> Bed Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm transition-colors cursor-pointer",
                  viewMode === "table"
                    ? "bg-[var(--gray-100)] text-[var(--gray-900)] font-semibold"
                    : "text-[var(--gray-600)] hover:text-[var(--gray-900)]"
                )}
              >
                <TableIcon className="h-3.5 w-3.5" /> Table View
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: BLOCKS SELECTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider">
              1. Blocks & Wings
            </span>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1 text-xs h-7"
              onClick={() => setAddBlockOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add Block
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            {blocks.map((b) => {
              const isSelected = b.id === effectiveBlockId;
              return (
                <div key={b.id} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBlockId(b.id);
                      setSelectedFloorId("");
                    }}
                    className={cn(
                      "min-h-11 px-3.5 py-2 rounded-2xl md:rounded-sm border text-xs font-medium transition-colors flex items-center gap-2",
                      isSelected
                        ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)] font-semibold"
                        : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:border-[var(--gray-300)]"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>{b.name}</span>
                  </button>
                  {!b.id.startsWith("synth-") && (
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 rounded-full bg-red-100 text-red-600 items-center justify-center text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ open: true, type: "block", id: b.id, name: b.name });
                      }}
                      title={`Delete ${b.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
            {blocks.length === 0 && (
              <div className="w-full space-y-3">
                <div className="register-card p-6 text-center space-y-3">
                  <p className="text-sm font-semibold text-[var(--gray-900)]">
                    Start by adding a block or wing (e.g. Block A, Main Wing)
                  </p>
                  <Button size="sm" className="gap-1.5" onClick={() => setAddBlockOpen(true)}>
                    <Plus className="h-4 w-4" /> Add Block
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-55 pointer-events-none select-none">
                  <div className="register-card p-4 border-dashed">
                    <div className="text-xs font-semibold text-[var(--gray-600)]">3. Floor (Locked)</div>
                    <div className="text-[11px] text-[var(--gray-500)] mt-1">Add a block first to unlock floors.</div>
                  </div>
                  <div className="register-card p-4 border-dashed">
                    <div className="text-xs font-semibold text-[var(--gray-600)]">4. Room (Locked)</div>
                    <div className="text-[11px] text-[var(--gray-500)] mt-1">Add a floor inside a block to add rooms.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: FLOORS SELECTION */}
        {effectiveBlockId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider">
                2. Floors
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1 text-xs h-7"
                onClick={handleOpenAddFloor}
              >
                <Plus className="h-3.5 w-3.5" /> Add Floor
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              {floors.map((f) => {
                const isSelected = f.id === effectiveFloorId;
                return (
                  <div key={f.id} className="relative group shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedFloorId(f.id)}
                      className={cn(
                        "min-h-11 px-3.5 py-1.5 rounded-2xl md:rounded-sm border text-xs font-medium transition-colors flex items-center gap-1.5",
                        isSelected
                          ? "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)] font-semibold"
                          : "bg-white text-[var(--gray-700)] border-[var(--gray-200)] hover:border-[var(--gray-300)]"
                      )}
                    >
                      <Layers className="h-3 w-3" />
                      <span>{f.name}</span>
                    </button>
                    {!f.id.startsWith("synth-") && (
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 rounded-full bg-red-100 text-red-600 items-center justify-center text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, type: "floor", id: f.id, name: f.name });
                        }}
                        title={`Delete ${f.name}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              {floors.length === 0 && (
                <div className="w-full register-card p-5 text-center space-y-2.5">
                  <p className="text-xs font-medium text-[var(--gray-700)]">
                    Add a floor to {blocks.find((b) => b.id === effectiveBlockId)?.name || "this block"}
                  </p>
                  <Button size="sm" variant="secondary" className="gap-1.5" onClick={handleOpenAddFloor}>
                    <Plus className="h-3.5 w-3.5" /> Add Floor
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: ROOMS & BED MATRIX (Shown only after Block & Floor exist) */}
        {effectiveBlockId && effectiveFloorId && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <span className="text-xs font-semibold text-[var(--gray-700)] uppercase tracking-wider block">
                  3. Rooms & Bed Matrix
                </span>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  Click any vacant bed tile to start new tenant onboarding with pre-selected room & bed.
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={handleOpenAddRoom}>
                <Plus className="h-3.5 w-3.5" /> Add Room
              </Button>
            </div>

            {/* Visual Bed Grid Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--gray-600)] bg-[var(--gray-50)] px-3 py-1.5 rounded-sm border border-[var(--gray-200)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-white border border-[var(--gray-400)]" /> Vacant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> On notice
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[var(--gray-300)]" /> Blocked
              </span>
            </div>
          </div>

          {allRoomsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="register-card p-8">
              <EmptyState
                icon={<DoorOpen />}
                title={`No rooms in ${floors.find((f) => f.id === effectiveFloorId)?.name || "this floor"}`}
                description="Add rooms to this floor to track bed occupancy and allocate new tenants."
                action={
                  <Button size="sm" onClick={handleOpenAddRoom}>
                    Add Room
                  </Button>
                }
              />
            </div>
          ) : viewMode === "grid" ? (
            /* Bed Grid View - Responsive 2 columns on tablet so headers and bed tiles never truncate */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {rooms.map((r: any) => {
                const bedCount = Number(r.capacity || r.numberOfBeds || r.beds?.length || 1);

                // Assigned tenants for this room
                const roomTenants = tenantsData.filter(
                  (t: any) =>
                    String(t.roomNumber) === String(r.roomNumber) ||
                    String(t.roomNo) === String(r.roomNumber) ||
                    t.roomId === r.id ||
                    t.room?.id === r.id
                );

                const occupiedCount = roomTenants.length;
                const isFull = occupiedCount >= bedCount;

                return (
                  <div
                    key={r.id}
                    className="register-card p-3.5 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--gray-900)] whitespace-nowrap">
                          Room {r.roomNumber}
                        </span>
                        <StatusBadge
                          status={isFull ? "occupied" : "vacant"}
                          label={isFull ? "Full" : `${Math.max(0, bedCount - occupiedCount)} vacant`}
                          size="sm"
                        />
                        {(() => {
                          const tpl = getRoomTplName(r.id);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInventoryRoom(r);
                              }}
                              title="Click to view & edit room inventory"
                              className="inline-flex items-center"
                            >
                              {tpl ? (
                                <Badge variant="outline" className="text-[10px] font-medium bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100 cursor-pointer">
                                  <Package className="h-2.5 w-2.5 text-teal-600 mr-0.5" />
                                  <span className="capitalize truncate max-w-[80px]">{tpl}</span>
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] font-medium bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 cursor-pointer">
                                  <Package className="h-2.5 w-2.5 text-amber-600 mr-0.5" />
                                  Not set
                                </Badge>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-11 w-11 p-0 text-[var(--gray-500)] hover:text-primary cursor-pointer md:h-6 md:w-6"
                          onClick={() => handleOpenEditRoom(r)}
                          title="Edit room master details"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-[var(--gray-500)] whitespace-nowrap">
                          {bedCount} {bedCount === 1 ? "Bed" : "Beds"}
                        </span>
                      </div>
                    </div>

                    {/* Room Attributes Chips (OW-16) */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      {(r.rentPerBed > 0 || r.monthlyRent > 0) && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ₹{r.rentPerBed || r.monthlyRent}/bed
                        </span>
                      )}
                      {(r.acType === "AC" || r.isAc) && (
                        <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-1 rounded border border-sky-200">
                          AC
                        </span>
                      )}
                      {(r.hasAttachedBathroom || r.hasAttachedBath) && (
                        <span className="text-[10px] text-purple-800 bg-purple-50 px-1 rounded border border-purple-200">
                          Attached Bath
                        </span>
                      )}
                      {r.hasElectricityMeter && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                          Meter
                        </span>
                      )}
                    </div>

                    {/* Beds Grid */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {Array.from({ length: bedCount }).map((_, idx) => {
                        const assignedTenant = roomTenants[idx];
                        const isOccupied = Boolean(assignedTenant);
                        const isOnNotice = Boolean(assignedTenant?.notice?.isOnNotice || assignedTenant?.isOnNotice);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              if (isOccupied && assignedTenant?.id) {
                                navigate(`/tenants/${assignedTenant.id}`);
                              } else {
                                // 1-click allocation from vacant bed
                                navigate("/tenants/add", {
                                  state: {
                                    prefillRoomId: r.id,
                                    prefillRoomNumber: r.roomNumber,
                                    prefillBedNumber: idx + 1,
                                    prefillBlockId: effectiveBlockId,
                                    prefillFloorId: effectiveFloorId,
                                  },
                                });
                              }
                            }}
                            className={cn(
                              "rounded-sm p-2 text-left text-xs border transition-colors flex flex-col justify-between h-14 min-w-0 cursor-pointer",
                              isOccupied
                                ? isOnNotice
                                    ? "bg-amber-50 border-amber-200 text-amber-900"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                                : "bg-white border-dashed border-[var(--gray-300)] text-[var(--gray-500)] hover:border-[var(--brand-600)] hover:text-[var(--brand-600)]"
                            )}
                            aria-label={isOccupied ? `Bed ${idx + 1}, occupied by ${assignedTenant.name}` : `Bed ${idx + 1} is vacant. Add a tenant.`}
                            title={isOccupied ? `Occupied by ${assignedTenant.name}` : `Bed ${idx + 1} is vacant. Click to add tenant.`}
                          >
                            <div className="flex items-center justify-between font-medium w-full">
                              <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                                <BedDouble className="h-3 w-3 shrink-0" /> Bed {idx + 1}
                              </span>
                              <span
                                className={cn(
                                  "h-2 w-2 rounded-full shrink-0",
                                  isOccupied
                                    ? isOnNotice
                                      ? "bg-amber-500"
                                      : "bg-emerald-600"
                                    : "bg-transparent border border-[var(--gray-400)]"
                                )}
                              />
                            </div>
                            <span className="truncate text-[11px] font-semibold w-full block">
                              {isOccupied ? assignedTenant.name || "Tenant" : "+ Allocate"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--gray-200)] text-xs text-[var(--gray-500)]">
                      {(() => {
                        const floorVal = (typeof r.floor === "string" && r.floor.trim())
                          ? r.floor.trim()
                          : r.floorName || r.floor?.name || (r.floorNumber != null ? String(r.floorNumber) : (r.floorId ? floors.find((f: any) => f.id === r.floorId)?.name : null));
                        const blockVal = (typeof r.block === "string" && r.block.trim())
                          ? r.block.trim()
                          : r.blockName || (r.blockId ? blocks.find((b: any) => b.id === r.blockId)?.name : null);
                        const floorDisplay = floorVal
                          ? (floorVal.toLowerCase().startsWith("floor") || floorVal.toLowerCase().includes("ground") || floorVal.toLowerCase().includes("basement") ? floorVal : `Floor ${floorVal}`)
                          : "Floor not set";
                        const blockDisplay = blockVal ? `${blockVal} · ` : "";
                        return (
                          <span className="truncate" title={`${blockDisplay}${floorDisplay}`}>
                            {blockDisplay}{floorDisplay}
                          </span>
                        );
                      })()}
                      {!r.id.startsWith("synth-") && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ open: true, type: "room", id: r.id, name: `Room ${r.roomNumber}` })}
                          className="text-[var(--gray-400)] hover:text-red-600"
                          aria-label={`Delete room ${r.roomNumber}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <DataTable
              columns={[
                {
                  id: "roomNumber",
                  header: "Room #",
                  render: (r: any) => (
                    <span className="font-semibold text-[var(--gray-900)]">Room {r.roomNumber}</span>
                  ),
                },
                {
                  id: "floor",
                  header: "Floor",
                  render: (r: any) => (
                    <span className="text-[var(--gray-600)]">{r.floor || `Floor ${r.floorNumber ?? 1}`}</span>
                  ),
                },
                {
                  id: "block",
                  header: "Block",
                  render: (r: any) => (
                    <span className="text-[var(--gray-600)]">{r.block || "Main Wing"}</span>
                  ),
                },
                {
                  id: "capacity",
                  header: "Capacity",
                  align: "right",
                  render: (r: any) => (
                    <span className="tabular-nums">{r.numberOfBeds || r.capacity || 2} beds</span>
                  ),
                },
                {
                  id: "occupied",
                  header: "Occupied",
                  align: "right",
                  render: (r: any) => {
                    const roomTenants = tenantsData.filter(
                      (t: any) => String(t.roomNumber) === String(r.roomNumber) || t.roomId === r.id
                    );
                    return <span className="tabular-nums font-medium text-emerald-700">{roomTenants.length}</span>;
                  },
                },
                {
                  id: "inventory",
                  header: "Inventory",
                  render: (r: any) => {
                    const tpl = getRoomTplName(r.id);
                    return (
                      <button
                        type="button"
                        onClick={() => setInventoryRoom(r)}
                        className="flex items-center gap-1.5 text-xs text-left group"
                        title="Click to view & edit room inventory"
                      >
                        {tpl ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200 group-hover:bg-teal-100">
                            <Package className="h-3 w-3 text-teal-600" />
                            <span className="capitalize">{tpl}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 group-hover:bg-amber-100">
                            <Package className="h-3 w-3 text-amber-600" />
                            Not set
                          </span>
                        )}
                      </button>
                    );
                  },
                },
                {
                  id: "status",
                  header: "Status",
                  render: (r: any) => {
                    const bedCount = Number(r.capacity || r.numberOfBeds || 1);
                    const roomTenants = tenantsData.filter(
                      (t: any) => String(t.roomNumber) === String(r.roomNumber) || t.roomId === r.id
                    );
                    const isFull = roomTenants.length >= bedCount;
                    return (
                      <StatusBadge
                        status={isFull ? "occupied" : "vacant"}
                        label={isFull ? "Full" : `${Math.max(0, bedCount - roomTenants.length)} Vacant`}
                        size="sm"
                      />
                    );
                  },
                },
                {
                  id: "actions",
                  header: "",
                  align: "right",
                  render: (r: any) => (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-teal-200 text-teal-700 hover:bg-teal-50 gap-1 px-2"
                        onClick={() => setInventoryRoom(r)}
                        title="Room Inventory"
                      >
                        <Package className="h-3 w-3" />
                        <span className="hidden sm:inline">Inventory</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1 px-2 text-[var(--gray-700)] hover:text-primary"
                        onClick={() => handleOpenEditRoom(r)}
                        title="Edit Room"
                      >
                        <Pencil className="h-3 w-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() =>
                          navigate("/tenants/add", {
                            state: { prefillRoomId: r.id, prefillRoomNumber: r.roomNumber },
                          })
                        }
                      >
                        + Allocate
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={rooms}
              keyExtractor={(r: any) => r.id}
            />
          )}
        </div>
        )}

        {/* LEGACY UNASSIGNED ROOMS */}
        {unassignedRooms.length > 0 && (
          <div className="register-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                  Unassigned Rooms ({unassignedRooms.length})
                </h3>
                <p className="text-xs text-[var(--gray-500)]">
                  Legacy rooms without a block or floor. Move each to a block/floor.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {unassignedRooms.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-md border border-[var(--gray-200)] bg-[var(--gray-50)]"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--gray-900)] truncate">
                      Room {r.roomNumber}
                    </div>
                    <div className="text-[11px] text-[var(--gray-500)]">
                      {Number(r.capacity || r.numberOfBeds || 1)} beds
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs shrink-0"
                    onClick={() => handleOpenEditRoom(r)}
                  >
                    Move to block/floor
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIALOG 1: ADD PROPERTY MODAL */}
        <Dialog open={addPropertyOpen} onOpenChange={setAddPropertyOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--brand-600)]" /> Add New PG Property
              </DialogTitle>
              <DialogDescription>
                Create a new property profile in your PG Ease portfolio.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label>Property Name *</Label>
                <Input
                  placeholder="e.g. Green Villa PG"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  placeholder="e.g. 12th Main, Sector 62"
                  value={propertyForm.address}
                  onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input
                    placeholder="e.g. Noida"
                    value={propertyForm.city}
                    onChange={(e) => setPropertyForm({ ...propertyForm, city: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="e.g. 201301"
                    value={propertyForm.pincode}
                    onChange={(e) => setPropertyForm({ ...propertyForm, pincode: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddPropertyOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateProperty}>
                Create Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: ADD BLOCK MODAL */}
        <Dialog open={addBlockOpen} onOpenChange={setAddBlockOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--brand-600)]" /> Add Block / Wing
              </DialogTitle>
              <DialogDescription>
                Name the building section (e.g. Block A, Girls Wing, Annex).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-xs">
              <Label>Block Name *</Label>
              <Input
                placeholder="e.g. Block A"
                value={blockName}
                onChange={(e) => setBlockName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddBlockOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateBlock} disabled={createBlockMut.isPending}>
                Save Block
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD FLOOR MODAL */}
        <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--brand-600)]" /> Add Floor
              </DialogTitle>
              <DialogDescription>
                Add a floor level to {blocks.find((b) => b.id === effectiveBlockId)?.name || "block"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-xs">
              <Label>Floor Name *</Label>
              <Input
                placeholder="e.g. Ground Floor, 1st Floor"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddFloorOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateFloor} disabled={createFloorMut.isPending}>
                Save Floor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: ADD ROOM MODAL */}
        <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-[var(--brand-600)]" /> Add Room & Bed Capacity
              </DialogTitle>
              <DialogDescription>
                Specify the room number and how many beds it contains.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-md bg-[#E6F3F3] text-[#005F5F] font-medium">
                <span>Block: {blocks.find((b) => b.id === effectiveBlockId)?.name || "—"}</span>
                <span>·</span>
                <span>Floor: {floors.find((f) => f.id === effectiveFloorId)?.name || "—"}</span>
              </div>
              <div className="space-y-1">
                <Label>Room Number / Name *</Label>
                <Input
                  placeholder="e.g. 101, 202-A"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Bed Count</Label>
                <Select
                  value={String(roomForm.numberOfBeds)}
                  onValueChange={(val) => setRoomForm({ ...roomForm, numberOfBeds: parseInt(val, 10) })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {b} Bed{b > 1 ? "s" : ""} ({b} Sharing)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setAddRoomOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateRoom} disabled={createRoomMut.isPending}>
                Save Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION DIALOG */}
        <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#B42318] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" /> Delete {deleteConfirm.type}
              </DialogTitle>
              <p className="text-xs text-[var(--gray-600)] mt-1">
                Are you sure you want to delete <strong className="text-[var(--gray-900)]">{deleteConfirm.name}</strong>?
                This action cannot be undone.
              </p>
            </DialogHeader>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm((prev) => ({ ...prev, open: false }))}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete}>
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {inventoryRoom && (
          <RoomInventoryDrawer
            open={Boolean(inventoryRoom)}
            onOpenChange={(open) => !open && setInventoryRoom(null)}
            pgId={currentPropertyId || ""}
            room={inventoryRoom}
            onUpdated={() => setInvRefreshTick((t) => t + 1)}
          />
        )}

        <TrialExpiredGateModal
          open={trialExpiredOpen}
          onOpenChange={setTrialExpiredOpen}
          featureName={trialExpiredFeature}
        />

        {/* DIALOG 5: EDIT ROOM MASTER MODAL (OW-16) */}
        <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" /> Edit Room Master: Room {editingRoom?.roomNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update room configuration, bed capacity, per-bed tariff, and amenities.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Room Number / Name *</Label>
                  <Input
                    value={editRoomForm.roomNumber}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, roomNumber: e.target.value })}
                    className="h-8 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Floor</Label>
                  <Select
                    value={editRoomForm.floorId}
                    onValueChange={(val) => setEditRoomForm({ ...editRoomForm, floorId: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((f: any) => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bed Capacity</Label>
                  <Select
                    value={String(editRoomForm.numberOfBeds)}
                    onValueChange={(val) => setEditRoomForm({ ...editRoomForm, numberOfBeds: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((b) => (
                        <SelectItem key={b} value={String(b)} className="text-xs">
                          {b} Bed{b > 1 ? "s" : ""} ({b === 1 ? "Single" : b === 2 ? "Double" : b === 3 ? "Triple" : `${b} Sharing`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rent Per Bed (₹ / month)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editRoomForm.rentPerBed}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, rentPerBed: Number(e.target.value) })}
                    className="h-8 text-xs font-semibold"
                    placeholder="e.g. 7500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-2.5 bg-muted/30 rounded-xl border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-muted-foreground">Cooling Type</Label>
                  <Select
                    value={editRoomForm.acType}
                    onValueChange={(val) => setEditRoomForm({ ...editRoomForm, acType: val })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC" className="text-xs">AC Room</SelectItem>
                      <SelectItem value="NON_AC" className="text-xs">Non-AC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editRoomForm.hasAttachedBathroom}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, hasAttachedBathroom: e.target.checked })}
                      className="rounded border-slate-300 h-4 w-4 text-primary"
                    />
                    Attached Bathroom
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editRoomForm.hasBalcony}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, hasBalcony: e.target.checked })}
                      className="rounded border-slate-300 h-4 w-4 text-primary"
                    />
                    Private Balcony
                  </label>
                </div>
              </div>

              <div className="p-2.5 bg-muted/30 rounded-xl border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={editRoomForm.hasElectricityMeter}
                    onChange={(e) => setEditRoomForm({ ...editRoomForm, hasElectricityMeter: e.target.checked })}
                    className="rounded border-slate-300 h-4 w-4 text-primary"
                  />
                  Has Sub-Meter / Electricity Meter
                </label>
                {editRoomForm.hasElectricityMeter && (
                  <div className="space-y-1 pl-6">
                    <Label className="text-[11px] text-muted-foreground">Meter Number</Label>
                    <Input
                      value={editRoomForm.meterNumber}
                      onChange={(e) => setEditRoomForm({ ...editRoomForm, meterNumber: e.target.value })}
                      placeholder="e.g. MTR-R101-01"
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Notes / Special Instructions</Label>
                <Input
                  value={editRoomForm.notes}
                  onChange={(e) => setEditRoomForm({ ...editRoomForm, notes: e.target.value })}
                  placeholder="e.g. Window facing garden, newly painted"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setEditRoomOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  updateRoomMut.mutate({
                    roomId: editingRoom.id,
                    payload: {
                      roomNumber: editRoomForm.roomNumber.trim(),
                      floorId: editRoomForm.floorId || undefined,
                      numberOfBeds: Number(editRoomForm.numberOfBeds),
                      rentPerBed: Number(editRoomForm.rentPerBed),
                      acType: editRoomForm.acType,
                      hasAttachedBathroom: editRoomForm.hasAttachedBathroom,
                      hasBalcony: editRoomForm.hasBalcony,
                      hasElectricityMeter: editRoomForm.hasElectricityMeter,
                      meterNumber: editRoomForm.meterNumber.trim() || undefined,
                      notes: editRoomForm.notes.trim() || undefined,
                    },
                  })
                }
                disabled={updateRoomMut.isPending || !editRoomForm.roomNumber.trim()}
              >
                {updateRoomMut.isPending ? "Saving..." : "Save Room Details"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CanAccessPage>
  );
}
