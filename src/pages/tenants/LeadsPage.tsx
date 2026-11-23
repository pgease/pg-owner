import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { CanAccessPage } from "@/components/PermissionGuard";

export default function LeadsPage() {
  return (
    <CanAccessPage permission="tenant_view">
      <div className="max-w-3xl space-y-4 pb-12">
        <PageHeader
          title="Leads & Visits"
          description="Visit bookings and enquiry follow-ups will live here."
        />
        <div className="rounded-xl border border-[var(--gray-200)] bg-white px-5 py-8">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F4F4] text-[#008080]">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--gray-900)]">Coming soon</p>
              <p className="mt-1 max-w-md text-sm text-[var(--gray-600)]">
                You will be able to log property visits, mark a lead as booked, and follow up from this page. It is not part of the daily workflow yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </CanAccessPage>
  );
}
