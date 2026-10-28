import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authStorage } from "@/api/http";
import { isAppShell } from "@/lib/appShell";
import { SplashCarousel } from "./SplashCarousel";

export function PublicAuthGate({ children }: { children: ReactNode }) {
  const token = authStorage.getAccessToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAppShell()) {
    return <>{children}</>;
  }

  return <SplashCarousel>{children}</SplashCarousel>;
}
