import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authStorage, appPrefs } from "@/api/http";
import { Loader2, MessageSquare } from "lucide-react";

export const WhatsAppRedirectPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    // Extract suffix after /wa/
    const rawSuffix = location.pathname.replace(/^\/wa\/?/, "").trim();
    const cleanSuffix = rawSuffix.split("?")[0];
    const searchParams = location.search;

    let destination = "/dashboard";
    let extractedPgId: string | null = null;

    // 1. Signed token suffix: s/{token}
    if (cleanSuffix.startsWith("s/")) {
      const token = cleanSuffix.slice(2);
      try {
        const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(normalized);
        const parsed = JSON.parse(json);

        if (parsed.pgId) {
          extractedPgId = parsed.pgId;
        }

        switch (parsed.type) {
          case "payment":
          case "manual_payment":
            destination = parsed.entityId ? `/rent-payments?paymentId=${parsed.entityId}` : "/rent-payments";
            break;
          case "complaint":
            destination = parsed.entityId ? `/complaints?id=${parsed.entityId}` : "/complaints";
            break;
          case "nightout":
          case "night-out":
            destination = parsed.entityId ? `/nightout?id=${parsed.entityId}` : "/nightout";
            break;
          case "tenant":
            destination = parsed.entityId || parsed.tenantId ? `/tenants/${parsed.entityId || parsed.tenantId}` : "/tenants";
            break;
          case "notice":
            destination = "/my-pgs/notices";
            break;
          case "checkout":
            destination = "/tenants/notice-period";
            break;
          case "credits":
            destination = "/tenants/kyc";
            break;
          case "alert":
            destination = "/dashboard";
            break;
          default:
            destination = "/dashboard";
        }
      } catch (e) {
        console.error("Failed to parse signed token", e);
        destination = "/dashboard";
      }
    } else {
      // 2. Readable path suffix mapping
      // e.g. pg/{pgId}/payments/{paymentId} or payments/{paymentId}
      const parts = cleanSuffix.split("/").filter(Boolean);

      // Check if starts with pg/{pgId}
      if (parts[0] === "pg" && parts.length >= 2) {
        extractedPgId = parts[1];
        parts.splice(0, 2); // remove 'pg', ':pgId'
      }

      const entity = parts[0]?.toLowerCase() || "";
      const entityId = parts[1] || "";

      if (entity.includes("payment")) {
        destination = entityId ? `/rent-payments?paymentId=${entityId}` : `/rent-payments${searchParams}`;
      } else if (entity.includes("complaint")) {
        destination = entityId ? `/complaints?id=${entityId}` : `/complaints${searchParams}`;
      } else if (entity.includes("night")) {
        destination = entityId ? `/nightout?id=${entityId}` : `/nightout${searchParams}`;
      } else if (entity.includes("tenant")) {
        destination = entityId ? `/tenants/${entityId}` : `/tenants${searchParams}`;
      } else if (entity.includes("notice")) {
        destination = `/my-pgs/notices${searchParams}`;
      } else if (entity.includes("checkout")) {
        destination = `/tenants/notice-period${searchParams}`;
      } else if (entity.includes("credit")) {
        destination = `/tenants/kyc${searchParams}`;
      } else if (entity.includes("alert")) {
        destination = `/dashboard${searchParams}`;
      } else {
        destination = `/dashboard${searchParams}`;
      }
    }

    if (extractedPgId) {
      appPrefs.setSelectedPgId(extractedPgId);
    }

    setTarget(destination);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!target) return;

    const token = authStorage.getAccessToken();
    const isAuthenticated = Boolean(token);

    if (isAuthenticated) {
      navigate(target, { replace: true });
    } else {
      sessionStorage.setItem("pgease_post_login_redirect", target);
      navigate(`/login?redirect=${encodeURIComponent(target)}`, { replace: true });
    }
  }, [target, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 mb-4 animate-bounce">
        <MessageSquare className="h-6 w-6" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-teal-600 mb-2" />
      <h2 className="text-sm font-bold text-foreground">Redirecting to owner record...</h2>
      <p className="text-xs text-muted-foreground mt-1">Opening your requested PG Ease dashboard screen.</p>
    </div>
  );
};

export default WhatsAppRedirectPage;

