import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Plus,
  Check,
  X,
  Search,
  Clock,
  Volume2,
  Users,
  Cigarette,
  Wine,
  PawPrint,
  UtensilsCrossed,
  Save,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { CanAccess, CanAccessPage } from "@/components/PermissionGuard";
import { useApp } from "@/context/AppContext";
import {
  useRestrictions,
  useCreateCustomRestriction,
  useLinkRestrictions,
} from "@/hooks/usePropertyOwnerQueries";
import { cn } from "@/lib/utils";

// Dynamic icon resolver for restrictions
const getRestrictionIcon = (name: string) => {
  const n = (name || "").toLowerCase();
  if (n.includes("smoke") || n.includes("smoking") || n.includes("cigarette") || n.includes("tobacco")) return Cigarette;
  if (n.includes("alcohol") || n.includes("drink") || n.includes("liquor") || n.includes("drugs") || n.includes("substance")) return Wine;
  if (n.includes("pet") || n.includes("dog") || n.includes("cat") || n.includes("animal")) return PawPrint;
  if (n.includes("food") || n.includes("non-veg") || n.includes("meat") || n.includes("cook")) return UtensilsCrossed;
  if (n.includes("gate") || n.includes("curfew") || n.includes("time") || n.includes("timing") || n.includes("night") || n.includes("pm") || n.includes("am")) return Clock;
  if (n.includes("guest") || n.includes("visitor") || n.includes("boy") || n.includes("girl") || n.includes("opposite") || n.includes("gender") || n.includes("friend")) return Users;
  if (n.includes("music") || n.includes("noise") || n.includes("sound") || n.includes("loud") || n.includes("party")) return Volume2;
  if (n.includes("appliance") || n.includes("heater") || n.includes("induction") || n.includes("electric")) return AlertTriangle;
  if (n.includes("police") || n.includes("kyc") || n.includes("verification") || n.includes("id") || n.includes("aadhaar")) return ShieldCheck;
  return Ban;
};

export const RestrictionsPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  const { data: rawRestrictions = [], isLoading, isError, refetch } = useRestrictions(selectedPgId);
  const createRestrictionMutation = useCreateCustomRestriction(selectedPgId);
  const linkRestrictionMutation = useLinkRestrictions(selectedPgId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customRestrictionName, setCustomRestrictionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Normalize server restrictions list
  const restrictionsList = useMemo(() => {
    return Array.isArray(rawRestrictions) ? rawRestrictions : [];
  }, [rawRestrictions]);

  // Sync initially linked restrictions from server
  useEffect(() => {
    if (restrictionsList && restrictionsList.length > 0) {
      const currentlyLinked = restrictionsList.filter((r: any) => r.linked).map((r: any) => r.id);
      setSelectedIds(currentlyLinked);
    } else {
      setSelectedIds([]);
    }
  }, [restrictionsList]);

  // Track if changes are unsaved
  const serverLinkedIds = useMemo(() => {
    return restrictionsList.filter((r: any) => r.linked).map((r: any) => r.id).sort();
  }, [restrictionsList]);

  const hasUnsavedChanges = useMemo(() => {
    const current = [...selectedIds].sort();
    if (current.length !== serverLinkedIds.length) return true;
    return current.some((id, idx) => id !== serverLinkedIds[idx]);
  }, [selectedIds, serverLinkedIds]);

  // Select / Unselect toggle
  const toggleRestriction = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(restrictionsList.map((r: any) => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Save selected restrictions via PUT API
  const handleSaveRestrictions = async () => {
    if (!selectedPgId) {
      toast({ title: "Please select a PG first", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await linkRestrictionMutation.mutateAsync({ restrictionIds: selectedIds });
      toast({
        title: "Restrictions Saved",
        description: `Successfully updated restrictions for ${selectedPg?.name || "your PG"}.`,
      });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Failed to update restrictions",
        description: e?.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create custom restriction via POST API and auto-select
  const handleCreateCustom = async () => {
    const trimmed = customRestrictionName.trim();
    if (!trimmed) {
      toast({ title: "Please enter a restriction name", variant: "destructive" });
      return;
    }

    // Check if it already exists in the list
    const existing = restrictionsList.find(
      (r: any) => r.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      if (!selectedIds.includes(existing.id)) {
        setSelectedIds((prev) => [...prev, existing.id]);
      }
      setCustomRestrictionName("");
      toast({
        title: "Restriction Selected",
        description: `"${trimmed}" is already in your list and has been activated.`,
      });
      return;
    }

    setIsAddingCustom(true);
    try {
      const created: any = await createRestrictionMutation.mutateAsync({ name: trimmed });
      setCustomRestrictionName("");
      toast({
        title: "Restriction Added",
        description: `"${trimmed}" added and activated for your PG. Remember to click Save Changes.`,
      });
      await refetch();
      if (created?.id) {
        setSelectedIds((prev) => [...prev, created.id]);
      }
    } catch (e: any) {
      toast({
        title: "Failed to add restriction",
        description: e?.message || "Unable to save custom restriction",
        variant: "destructive",
      });
    } finally {
      setIsAddingCustom(false);
    }
  };

  // Split into Active vs Suggested restrictions
  const { activeRestrictions, suggestedRestrictions } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const active: any[] = [];
    const suggested: any[] = [];

    restrictionsList.forEach((item: any) => {
      const isSelected = selectedIds.includes(item.id);
      const matchesSearch = !query || item.name.toLowerCase().includes(query);

      if (isSelected) {
        if (!query || item.name.toLowerCase().includes(query)) {
          active.push(item);
        }
      } else {
        if (matchesSearch) {
          suggested.push(item);
        }
      }
    });

    return { activeRestrictions: active, suggestedRestrictions: suggested };
  }, [restrictionsList, selectedIds, searchQuery]);

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
                <Ban className="h-5 w-5 text-rose-600" />
                Restrictions
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground pl-10">
              Manage rules and restrictions for residents at <strong>{selectedPg?.name || "your PG"}</strong>. Tap any item to activate or remove.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <CanAccess permission="room_edit">
              <Button
                size="sm"
                className={cn(
                  "rounded-xl text-xs font-bold gap-1.5 shadow-xs transition-all",
                  hasUnsavedChanges
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-500/30"
                    : "bg-rose-600/90 hover:bg-rose-700 text-white"
                )}
                onClick={handleSaveRestrictions}
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
              placeholder="Search restrictions (e.g. Curfew, Smoking, Guests)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-muted/20 border-border/70"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
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

        {/* SECTION 1: ACTIVE RESTRICTIONS (TOP) */}
        <Card className="rounded-2xl border-rose-500/30 bg-rose-50/15 dark:bg-rose-950/10 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-rose-600 stroke-[3]" />
              Active Restrictions
            </CardTitle>
            <CardDescription className="text-xs">
              These restrictions are enforced for your property. Tap any restriction to remove it.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load restrictions from server.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                  Retry
                </Button>
              </div>
            ) : activeRestrictions.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-background/50">
                <p className="text-xs font-medium text-muted-foreground">
                  No restrictions active yet. Tap from the suggested list below or add a custom restriction.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeRestrictions.map((r: any) => {
                  const IconComp = getRestrictionIcon(r.name);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRestriction(r.id)}
                      className="p-3.5 rounded-xl border border-rose-500 bg-card text-left flex items-start justify-between gap-3 transition-all cursor-pointer group select-none shadow-xs hover:border-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/40"
                      title="Tap to remove"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-rose-600 text-white group-hover:bg-slate-500 transition-colors">
                          <IconComp className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold leading-snug block text-foreground group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                            {r.name}
                          </span>
                          <span className="text-[10px] text-rose-600 font-medium block mt-0.5 group-hover:text-muted-foreground">
                            Enforced
                          </span>
                        </div>
                      </div>

                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-rose-600 bg-rose-600 text-white group-hover:border-slate-400 group-hover:bg-slate-400 transition-colors mt-0.5">
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

        {/* SECTION 2: SUGGESTED RESTRICTIONS (BOTTOM) */}
        <Card className="rounded-2xl border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              Suggested Restrictions
            </CardTitle>
            <CardDescription className="text-xs">
              Tap any restriction to activate and enforce it on your property.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
              </div>
            ) : isError ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-rose-500 font-semibold">Failed to load restrictions.</p>
              </div>
            ) : suggestedRestrictions.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground">
                  {searchQuery
                    ? "No matching restrictions found."
                    : "All suggested restrictions have been activated. You can add more restrictions below."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {suggestedRestrictions.map((r: any) => {
                  const IconComp = getRestrictionIcon(r.name);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRestriction(r.id)}
                      className="p-3.5 rounded-xl border border-border/70 bg-card hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left flex items-start justify-between gap-3 transition-all cursor-pointer group select-none shadow-2xs"
                      title="Tap to activate"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-muted text-muted-foreground group-hover:bg-rose-600 group-hover:text-white transition-colors">
                          <IconComp className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-medium leading-snug block text-foreground group-hover:text-rose-900 dark:group-hover:text-rose-200 group-hover:font-semibold transition-colors">
                            {r.name}
                          </span>
                        </div>
                      </div>

                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0 border border-slate-300 group-hover:border-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all mt-0.5 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: PROMINENT INLINE ADD RESTRICTION BAR */}
        <Card className="rounded-2xl border-2 border-dashed border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-rose-600 stroke-[3]" />
                Add Restriction
              </h3>
              <p className="text-xs text-muted-foreground">
                Need a specific rule for your PG? Type below to add and activate it.
              </p>
            </div>
            <div className="flex items-center gap-2 max-w-md w-full">
              <Input
                placeholder="Type rule (e.g. Gate closes at 10:30 PM, No smoking in rooms)..."
                value={customRestrictionName}
                onChange={(e) => setCustomRestrictionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCustom();
                  }
                }}
                className="h-10 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-rose-500"
              />
              <Button
                onClick={handleCreateCustom}
                disabled={isAddingCustom || !customRestrictionName.trim()}
                className="h-10 rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs"
              >
                {isAddingCustom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Restriction
              </Button>
            </div>
          </div>
        </Card>

        {/* Sticky floating save bar when changes are pending */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background dark:bg-card dark:text-foreground px-5 py-3 rounded-2xl shadow-xl border border-border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs font-semibold">
              You have unsaved changes to your restrictions.
            </span>
            <Button
              size="sm"
              onClick={handleSaveRestrictions}
              disabled={isSaving}
              className="h-8 rounded-xl text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shrink-0"
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

export default RestrictionsPage;
