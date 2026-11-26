import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authStorage, hydrateAuthStorage, isAuthHydrated } from "@/api/http";
import pgeaseIconWhite from "@/assets/pgease-icon-white.png";

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const location = useLocation();
  const [hydrated, setHydrated] = useState(isAuthHydrated);

  useEffect(() => {
    if (!hydrated) {
      void hydrateAuthStorage().then(() => setHydrated(true));
    }
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[#008080] text-white">
        <div className="h-16 w-16 rounded-2xl bg-white/15 p-3 flex items-center justify-center mb-3 animate-pulse">
          <img src={pgeaseIconWhite} alt="PG Ease" className="h-full w-full object-contain" />
        </div>
      </div>
    );
  }

  if (!authStorage.isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
