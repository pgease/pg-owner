import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export interface Address6Value {
  houseNumber: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export function formatAddress6(addr?: Partial<Address6Value> | null): string {
  if (!addr) return "";
  return [
    addr.houseNumber,
    addr.street,
    addr.landmark,
    addr.city,
    addr.state,
    addr.pincode ? `PIN - ${addr.pincode}` : "",
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join(", ");
}

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

interface AddressFields6Props {
  label?: string;
  value: Address6Value;
  onChange: (val: Address6Value) => void;
  disabled?: boolean;
}

export function AddressFields6({ label, value, onChange, disabled }: AddressFields6Props) {
  const [openStateSelect, setOpenStateSelect] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const update = (field: keyof Address6Value, val: string) => {
    onChange({
      ...value,
      [field]: val,
    });
  };

  const filteredStates = INDIAN_STATES_AND_UTS.filter((s) =>
    s.toLowerCase().includes(stateSearch.trim().toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-xs text-foreground">{label}</Label>
          <span className="text-[10px] text-muted-foreground">Auto-normalized</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Input
            placeholder="House / Flat No."
            value={value.houseNumber}
            disabled={disabled}
            onChange={(e) => update("houseNumber", e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Street / Area"
            value={value.street}
            disabled={disabled}
            onChange={(e) => update("street", e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Landmark (optional)"
            value={value.landmark || ""}
            disabled={disabled}
            onChange={(e) => update("landmark", e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="City"
            value={value.city}
            disabled={disabled}
            onChange={(e) => update("city", e.target.value)}
            onBlur={(e) => update("city", toTitleCase(e.target.value.trim()))}
          />
        </div>
        <div>
          <Popover open={openStateSelect} onOpenChange={setOpenStateSelect}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                disabled={disabled}
                aria-expanded={openStateSelect}
                className="w-full justify-between font-normal h-10 px-3 text-sm text-left truncate"
              >
                <span className={cn("truncate", !value.state && "text-muted-foreground")}>
                  {value.state || "Select State / UT"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2" align="start">
              <input
                type="text"
                placeholder="Search state..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input mb-2 bg-background focus:outline-none focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredStates.length === 0 ? (
                  <p className="p-2 text-xs text-muted-foreground text-center">No state found</p>
                ) : (
                  filteredStates.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        update("state", st);
                        setOpenStateSelect(false);
                        setStateSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left rounded-md hover:bg-muted transition-colors",
                        value.state === st && "bg-teal-50 font-semibold text-teal-800"
                      )}
                    >
                      <span>{st}</span>
                      {value.state === st && <Check className="h-3.5 w-3.5 text-teal-600" />}
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Input
            placeholder="PIN Code (6 digits)"
            maxLength={6}
            disabled={disabled}
            value={value.pincode}
            onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
      </div>
    </div>
  );
}
