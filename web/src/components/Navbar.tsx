import React from "react";
import { User, Subscription } from "../types";
import {
  Tv,
  ShieldCheck,
  UserCheck,
  LogOut,
  Clock,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavbarProps {
  user: User;
  subscription: Subscription | null;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  subscription,
  isAdminView,
  onToggleAdminView,
  onLogout,
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 lg:px-6 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between">
        {/* Left: Sidebar Toggle + Brand */}
        <div className="flex items-center space-x-3">
          {/* Universal Sidebar Toggle Button (Desktop & Mobile) */}
          {onToggleSidebar && !isAdminView && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#dfe2ef] hover:text-white transition font-mono text-xs group"
              title={isSidebarOpen ? "Ocultar canales" : "Mostrar canales"}
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4 text-[#4edea3] group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Ocultar</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#4edea3] group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-[#4edea3]">Canales</span>
                </>
              )}
            </button>
          )}

          {/* Brand / Logo */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => isAdminView && onToggleAdminView()}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#00422b] flex items-center justify-center shadow-lg shadow-[#10b981]/25 flex-shrink-0 border border-[#10b981]/30">
              <Tv className="w-5 h-5 text-[#090d16]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-headline font-bold text-lg tracking-tight text-white">
                  GOLSTREAM
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/40">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#86948a] hidden sm:block">
                Strong IPTV • Transmisión Fútbol Ultra HD
              </p>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3">
          {/* Subscription Status Pill */}
          {subscription && (
            <div
              className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-md ${
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
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                isAdminView
                  ? "bg-[#10b981] text-[#090d16] font-bold shadow-lg shadow-[#10b981]/25"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-[#dfe2ef] border border-white/[0.08]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdminView ? "Ver Canales" : "Panel Admin"}</span>
            </button>
          )}

          {/* User Profile Badge */}
          <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-xs font-bold font-mono text-[#4edea3]">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</p>
              <p className="text-[10px] font-mono text-[#86948a] flex items-center">
                <UserCheck className="w-3 h-3 mr-0.5" />
                {user.role === "admin" ? "Administrador" : "Suscriptor"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#86948a] hover:text-white border border-white/[0.08] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
