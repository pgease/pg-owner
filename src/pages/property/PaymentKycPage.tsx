import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EasebuzzGatewayCard } from "@/components/property/EasebuzzGatewayCard";

export const PaymentKycPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12 p-4">
      <div className="flex items-center gap-3 border-b border-border/70 pb-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/my-pgs/bank")}
          title="Back to Bank Accounts"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <CreditCard className="h-5 w-5 text-primary" />
          Easebuzz Online Payment Gateway
        </h1>
      </div>

      <EasebuzzGatewayCard />
    </div>
  );
};

export default PaymentKycPage;
