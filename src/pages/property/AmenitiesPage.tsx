import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Check,
  X,
  Search,
  Wifi,
  Wind,
  Droplets,
  Zap,
  Shield,
  Tv,
  Utensils,
  Car,
  Dumbbell,
  Shirt,
  DoorOpen,
  Coffee,
  Save,
  Loader2,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import {
  useAmenities,
  useCreateCustomAmenity,
  useLinkAmenities,
} from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

// Dynamic icon resolver for facilities
const getFacilityIcon = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband")) return Wifi;
  if (n.includes("ac") || n.includes("air condition") || n.includes("cooler") || n.includes("air")) return Wind;
  if (n.includes("geyser") || n.includes("heater") || n.includes("water") || n.includes("washroom") || n.includes("bath")) return Droplets;
  if (n.includes("power") || n.includes("backup") || n.includes("generator") || n.includes("electric")) return Zap;
  if (n.includes("cctv") || n.includes("security") || n.includes("guard") || n.includes("biometric") || n.includes("warden")) return Shield;
  if (n.includes("clean") || n.includes("housekeep") || n.includes("maid")) return Sparkles;
  if (n.includes("wash") || n.includes("laundry") || n.includes("iron")) return Shirt;
  if (n.includes("tv") || n.includes("television") || n.includes("lounge") || n.includes("ott")) return Tv;
  if (n.includes("food") || n.includes("meal") || n.includes("mess") || n.includes("kitchen") || n.includes("dining") || n.includes("breakfast")) return Utensils;
  if (n.includes("ro") || n.includes("fridge") || n.includes("refrigerator") || n.includes("water dispenser") || n.includes("coffee") || n.includes("tea")) return Coffee;
  if (n.includes("park") || n.includes("car") || n.includes("bike") || n.includes("wheeler") || n.includes("vehicle")) return Car;
  if (n.includes("gym") || n.includes("fitness") || n.includes("workout")) return Dumbbell;
  if (n.includes("lift") || n.includes("elevator") || n.includes("door")) return DoorOpen;
  return Sparkles;
};

export const AmenitiesPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: rawAmenities = [], isLoading, isError, refetch } = useAmenities(selectedPgId);
  const createAmenityMutation = useCreateCustomAmenity(selectedPgId);
  const linkAmenityMutation = useLinkAmenities(selectedPgId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customFacilityName, setCustomFacilityName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Normalize server facilities list
  const facilitiesList = useMemo(() => {
    return Array.isArray(rawAmenities) ? rawAmenities : [];
  }, [rawAmenities]);

  // Sync initially linked facilities from server
  useEffect(() => {
    if (facilitiesList && facilitiesList.length > 0) {
      const currentlyLinked = facilitiesList.filter((a: any) => a.linked).map((a: any) => a.id);
      setSelectedIds(currentlyLinked);
    } else {
      setSelectedIds([]);
    }
  }, [facilitiesList]);

  // Track if changes are unsaved
  const serverLinkedIds = useMemo(() => {
    return facilitiesList.filter((a: any) => a.linked).map((a: any) => a.id).sort();
  }, [facilitiesList]);

  const hasUnsavedChanges = useMemo(() => {
    const current = [...selectedIds].sort();
    if (current.length !== serverLinkedIds.length) return true;
    return current.some((id, idx) => id !== serverLinkedIds[idx]);
  }, [selectedIds, serverLinkedIds]);

  // Select / Unselect toggle
  const toggleFacility = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(facilitiesList.map((a: any) => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Save selected facilities via PUT API
  const handleSaveFacilities = async () => {
    if (!selectedPgId) {
      toast({ title: "Please select a PG first", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await linkAmenityMutation.mutateAsync({ amenityIds: selectedIds });
      toast({
        title: "Facilities Saved",
        description: `Successfully updated facilities for ${selectedPg?.name || "your PG"}.`,
      });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Failed to update facilities",
        description: e?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create custom facility via POST API and auto-select
  const handleCreateCustom = async () => {
    const trimmed = customFacilityName.trim();
    if (!trimmed) {
      toast({ title: "Please enter a facility name", variant: "destructive" });
      return;
    }

    // Check if it already exists in the list
    const existing = facilitiesList.find(
      (a: any) => a.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (!selectedIds.includes(existing.id)) {
        setSelectedIds((prev) => [...prev, existing.id]);
      }
      setCustomFacilityName("");
      toast({
        title: "Facility Selected",
        description: `"${trimmed}" is already in your list and has been selected.`,
      });
      return;
    }

    setIsAddingCustom(true);
    try {
      const created: any = await createAmenityMutation.mutateAsync({ name: trimmed });
      setCustomFacilityName("");
      toast({
        title: "Facility Added",
        description: `"${trimmed}" added and selected for your PG. Remember to click Save Changes.`,
      });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({
        title: "Failed to add facility",
        description: e?.message || "Unable to save custom facility",
        variant: "destructive",
      });
    } finally {
      setIsAddingCustom(false);
    }
  };

  // Split into Selected vs Suggested facilities
  const { selectedFacilities, suggestedFacilities } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selected: any[] = [];
    const suggested: any[] = [];

    facilitiesList.forEach((item: any) => {
      const isSelected = selectedIds.includes(item.id);
      const matchesSearch = !query || item.name.toLowerCase().includes(query);

      if (isSelected) {
        if (!query || item.name.toLowerCase().includes(query)) {
          selected.push(item);
        }
      } else {
        if (matchesSearch) {
          suggested.push(item);
        }
      }
    });

    return { selectedFacilities: selected, suggestedFacilities: suggested };
  }, [facilitiesList, selectedIds, searchQuery]);

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-6 animate-fade-in max-w-6xl pb-24">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/my-pgs")}
                title="Back to PG Details"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-teal-600" />
                Facilities
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-10">
              Select facilities available for residents at <strong>{selectedPg?.name || "your PG"}</strong>. Tap any item to select or unselect.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <CanAccess permission="room_edit">
              <Button
                size="sm"
                className={cn(
                  "rounded-xl text-xs font-bold gap-1.5 shadow-xs transition-all",
                  hasUnsavedChanges
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md ring-2 ring-teal-500/30"
                    : "bg-teal-600/90 hover:bg-teal-700 text-white"
                )}
                onClick={handleSaveFacilities}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes *" : "Save Changes"}
              </Button>
            </CanAccess>
          </div>
        </div>

        {/* Search & Bulk Selection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/70 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search facilities (e.g. WiFi, AC, Geyser, Parking)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20 border-border/70"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950 rounded-lg transition-colors"
            >
              Select All
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* SECTION 1: SELECTED FACILITIES (TOP) */}
        <Card className="rounded-2xl border-teal-500/30 bg-teal-50/15 dark:bg-teal-950/10 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600 stroke-[3]" />
              Selected Facilities
            </CardTitle>
            <CardDescription className="text-xs">
              These facilities are active for your property. Tap any facility to remove it.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load facilities from server.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                  Retry
                </Button>
              </div>
            ) : selectedFacilities.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-background/50">
                <p className="text-xs font-medium text-muted-foreground">
                  No facilities selected yet. Tap from the suggested facilities below or add a new one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {selectedFacilities.map((a: any) => {
                  const IconComp = getFacilityIcon(a.name);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleFacility(a.id)}
                      className="p-3 rounded-xl border border-teal-500 bg-card text-left flex items-start justify-between gap-2.5 transition-all cursor-pointer group select-none shadow-xs hover:border-rose-400 hover:bg-rose-50/30 dark:hover:bg-rose-950/20"
                      title="Tap to remove"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-teal-600 text-white group-hover:bg-rose-500 transition-colors">
                          <IconComp className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-bold leading-snug line-clamp-2 text-foreground group-hover:text-rose-600 transition-colors">
                          {a.name}
                        </span>
                      </div>

                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-teal-600 bg-teal-600 text-white group-hover:border-rose-500 group-hover:bg-rose-500 transition-colors mt-0.5">
                        <Check className="h-3 w-3 stroke-[3] group-hover:hidden" />
                        <X className="h-3 w-3 stroke-[3] hidden group-hover:block" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: SUGGESTED FACILITIES (BOTTOM) */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              Suggested Facilities
            </CardTitle>
            <CardDescription className="text-xs">
              Tap any facility to add it to your property.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load facilities.</p>
              </div>
            ) : suggestedFacilities.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground">
                  {searchQuery
                    ? "No matching facilities found."
                    : "All suggested facilities have been selected. You can add more facilities below."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {suggestedFacilities.map((a: any) => {
                  const IconComp = getFacilityIcon(a.name);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleFacility(a.id)}
                      className="p-3 rounded-xl border border-border/70 bg-card hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 text-left flex items-start justify-between gap-2.5 transition-all cursor-pointer group select-none shadow-2xs"
                      title="Tap to select"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-muted text-muted-foreground group-hover:bg-teal-600 group-hover:text-white transition-colors">
                          <IconComp className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-medium leading-snug line-clamp-2 text-foreground group-hover:text-teal-900 dark:group-hover:text-teal-200 group-hover:font-semibold transition-colors">
                          {a.name}
                        </span>
                      </div>

                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-slate-300 group-hover:border-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all mt-0.5 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: PROMINENT INLINE ADD FACILITY BAR */}
        <Card className="rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600 stroke-[3]" />
                Add Facility
              </h3>
              <p className="text-xs text-muted-foreground">
                Can't find a facility in the list above? Type its name below to add and select it.
              </p>
            </div>
            <div className="flex items-center gap-2 max-w-md w-full">
              <Input
                placeholder="Type facility name (e.g. Badminton Court, Study Room)..."
                value={customFacilityName}
                onChange={(e) => setCustomFacilityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCustom();
                  }
                }}
                className="h-10 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-teal-500"
              />
              <Button
                onClick={handleCreateCustom}
                disabled={isAddingCustom || !customFacilityName.trim()}
                className="h-10 rounded-xl text-xs font-bold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shrink-0 shadow-xs"
              >
                {isAddingCustom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Facility
              </Button>
            </div>
          </div>
        </Card>

        {/* Sticky floating save bar when changes are pending */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background dark:bg-card dark:text-foreground px-5 py-3 rounded-2xl shadow-xl border border-border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs font-semibold">
              You have unsaved changes to your facilities.
            </span>
            <Button
              size="sm"
              onClick={handleSaveFacilities}
              disabled={isSaving}
              className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shrink-0"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </CanAccessPage>
  );
};

export default AmenitiesPage;
