import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authStorage } from "@/api/http";

export function PublicAuthGate({ children }: { children: ReactNode }) {
  const token = authStorage.getAccessToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
