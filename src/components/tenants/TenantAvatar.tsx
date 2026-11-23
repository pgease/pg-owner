import { useState } from "react";
import type { PropertyTenant } from "@/api/propertyOwner";
import { tenantInitials, tenantPhotoUrl } from "@/lib/tenantDisplay";
import { cn } from "@/lib/utils";

export function TenantAvatar({
  tenant,
  className,
}: {
  tenant?: PropertyTenant | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? tenantPhotoUrl(tenant) : "";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full bg-[#E8F4F4] text-[12px] font-semibold text-[#008080]",
        className,
      )}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        tenantInitials(tenant)
      )}
    </span>
  );
}
