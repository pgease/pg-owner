import { type ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authStorage, hydrateAuthStorage, isAuthHydrated } from "@/api/http";
import { isAppShell } from "@/lib/appShell";
import { SplashCarousel } from "./SplashCarousel";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";

export function PublicAuthGate({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(isAuthHydrated);

  useEffect(() => {
    if (!hydrated) {
      void hydrateAuthStorage().then(() => setHydrated(true));
    }
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[#008080] text-white">
        <div className="h-16 w-16 rounded-2xl bg-white/15 p-3 flex items-center justify-center animate-pulse">
          <img src={pgeaseIconWhite} alt="PG Ease" className="h-full w-full object-contain" />
        </div>
      </div>
    );
  }

  if (authStorage.isLoggedIn()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAppShell()) {
    return <SplashCarousel>{children}</SplashCarousel>;
  }

  return <>{children}</>;
}
