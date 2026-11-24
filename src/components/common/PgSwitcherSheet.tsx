import React from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, Plus, X, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface PgSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PgSwitcherSheet: React.FC<PgSwitcherSheetProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { properties, selectedPgId, setSelectedPgId } = useApp();
  const list = Array.isArray(properties) ? properties : [];

  if (!open) return null;

  const handleSelect = (id: string) => {
    setSelectedPgId(id);
    onOpenChange(false);
    // Invalidate queries so that dashboard, tenants, rooms, reports refresh immediately
    queryClient.invalidateQueries();
  };

  const handleAddNew = () => {
    onOpenChange(false);
    navigate("/my-pgs/structure");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop scrim */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pg-switcher-title"
        className="relative z-50 w-full sm:max-w-md bg-white rounded-t-[24px] sm:rounded-2xl p-5 shadow-2xl transition-transform animate-in slide-in-from-bottom-5 duration-200 border border-slate-100 max-h-[85vh] flex flex-col"
      >
        {/* Mobile handle */}
        <div className="sm:hidden mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-slate-300" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#008080]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 id="pg-switcher-title" className="text-base font-bold text-slate-900">
                Switch Property
              </h2>
              <p className="text-xs text-slate-500">
                {list.length} {list.length === 1 ? "property" : "properties"} managed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* PG List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[50vh]">
          {list.map((pg) => {
            const isSelected = pg.id === selectedPgId;
            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => handleSelect(pg.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-[#008080] bg-[#E6F3F3] shadow-xs"
                    : "border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm",
                      isSelected
                        ? "bg-[#008080] text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold truncate", isSelected ? "text-[#008080]" : "text-slate-900")}>
                      {pg.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{pg.address || "No address added"}</span>
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#008080] text-white shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                ) : null}
              </button>
            );
          })}

          {list.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              No properties registered yet.
            </div>
          )}
        </div>

        {/* Bottom Action: + Add new PG */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[#008080] text-[#008080] hover:bg-[#E6F3F3] text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>
    </div>
  );
};
