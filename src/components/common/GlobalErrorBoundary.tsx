import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/api/http";
import pgeaseIconColor from "@/assets/pgease-icon-color.png";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[PG Ease] Uncaught runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleLogout = () => {
    authStorage.clear();
    window.location.href = "/login";
  };

  private handleGoHome = () => {
    window.location.href = "/onboarding";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-poppins text-[#1F2937]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl border border-gray-200 text-center animate-in fade-in duration-200">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src={pgeaseIconColor} alt="PG Ease" className="h-8 w-8 object-contain" />
              <span className="font-extrabold text-lg text-gray-900 tracking-tight">PG Ease</span>
            </div>

            {/* Error Icon */}
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-[#008080] border border-teal-200/60 shadow-2xs">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="text-lg font-bold text-gray-900 mb-1">
              Something went wrong on this page
            </h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We encountered an unexpected display issue. Please reload the page or return to setup.
            </p>

            {import.meta.env.DEV && this.state.error?.message && (
              <details className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-3 text-left">
                <summary className="text-[11px] font-semibold text-gray-700 cursor-pointer">
                  Technical details (dev only)
                </summary>
                <p className="mt-2 text-[11px] font-mono text-gray-600 break-words">
                  {this.state.error.message}
                </p>
              </details>
            )}

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={this.handleReload}
                className="w-full h-11 rounded-xl bg-[#008080] hover:bg-[#006e6e] text-white font-semibold text-xs gap-2 shadow-xs transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="h-10 rounded-xl border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 gap-1.5"
                >
                  <Home className="h-3.5 w-3.5" />
                  Go to Setup
                </Button>

                <Button
                  onClick={this.handleLogout}
                  variant="outline"
                  className="h-10 rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-semibold text-gray-700 gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
