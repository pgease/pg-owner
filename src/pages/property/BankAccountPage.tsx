import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanAccessPage } from "@/components/PermissionGuard";
import { BankAccountManager } from "@/components/property/BankAccountManager";
import { EasebuzzGatewayCard } from "@/components/property/EasebuzzGatewayCard";
import { useApp } from "@/context/AppContext";

export const BankAccountPage = () => {
  const navigate = useNavigate();
  const { selectedPgId, properties } = useApp();
  const selectedPg = Array.isArray(properties) ? properties.find((p) => p.id === selectedPgId) : null;

  return (
    <CanAccessPage permission="room_view">
      <div className="space-y-6 animate-fade-in max-w-6xl pb-12">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/70 pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/my-pgs")}
                title="Back to PG Settings"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg md:text-page-title font-bold md:font-semibold text-slate-900 dark:text-white">Bank accounts</h1>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground md:pl-10">
              Accounts for {selectedPg?.name || "this PG"}. Online collection is set up below.
            </p>
          </div>
        </div>

        {/* Easebuzz Gateway Sub-Merchant & Online Toggle */}
        <EasebuzzGatewayCard />

        {/* Core Bank Account Manager component */}
        <BankAccountManager />
      </div>
    </CanAccessPage>
  );
};

export default BankAccountPage;
