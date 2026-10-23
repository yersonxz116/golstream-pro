import React from "react";
import { User, Subscription } from "../types";
import { Tv, ShieldCheck, UserCheck, LogOut, Clock, AlertTriangle } from "lucide-react";

interface NavbarProps {
  user: User;
  subscription: Subscription | null;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  subscription,
  isAdminView,
  onToggleAdminView,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0f131c]/95 backdrop-blur-md border-b border-[#262a34] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => isAdminView && onToggleAdminView()}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10b981] to-[#00422b] flex items-center justify-center shadow-lg shadow-[#10b981]/20">
            <Tv className="w-6 h-6 text-[#0f131c]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-headline font-bold text-xl tracking-tight text-white">GOLSTREAM</span>
              <span className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">PRO</span>
            </div>
            <p className="text-[11px] font-mono text-[#86948a] hidden sm:block">Strong IPTV • Exclusivo Fútbol</p>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3">
          {/* Subscription Status Pill for non-admin or informative for all */}
          {subscription && (
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                subscription.isExpired
                  ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30"
                  : subscription.daysRemaining <= 5
                  ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30 animate-pulse"
                  : "bg-[#10b981]/10 text-[#4edea3] border-[#10b981]/30"
              }`}
            >
              {subscription.isExpired ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suscripción Vencida</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {subscription.daysRemaining} {subscription.daysRemaining === 1 ? "día" : "días"} restantes
                  </span>
                </>
              )}
            </div>
          )}

          {/* Admin Switch Button */}
          {user.role === "admin" && (
            <button
              onClick={onToggleAdminView}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isAdminView
                  ? "bg-[#4edea3] text-[#003824] font-semibold shadow-md shadow-[#4edea3]/20"
                  : "bg-[#1c1f29] hover:bg-[#262a34] text-[#dfe2ef] border border-[#3c4a42]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdminView ? "Ver Canales" : "Panel Admin"}</span>
            </button>
          )}

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-[#262a34]">
            <div className="w-8 h-8 rounded-full bg-[#1c1f29] border border-[#3c4a42] flex items-center justify-center text-xs font-bold text-[#4edea3]">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] text-[#86948a] flex items-center">
                <UserCheck className="w-3 h-3 mr-0.5" />
                {user.role === "admin" ? "Administrador" : "Suscriptor"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="p-2 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] text-[#86948a] hover:text-white border border-[#262a34] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
