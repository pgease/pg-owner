import React from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const TAB_ROOTS = new Set(["/", "/dashboard", "/kpis", "/my-pgs", "/tenants", "/rent-payments", "/menu"]);

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navType = useNavigationType();

  const isTabRoot = TAB_ROOTS.has(location.pathname);
  const animClass = isTabRoot
    ? "ms-anim-tab"
    : navType === "PUSH"
      ? "ms-anim-push"
      : navType === "POP"
        ? "ms-anim-pop"
        : "";

  return (
    <div key={location.pathname} className={animClass}>
      {children}
    </div>
  );
}
