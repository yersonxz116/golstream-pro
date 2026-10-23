import React from "react";
import { Subscription } from "../types";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";

interface SubscriptionAlertProps {
  subscription: Subscription | null;
}

export const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ subscription }) => {
  if (!subscription) return null;

  // Warning when expiring soon (<= 5 days) but not yet expired
  if (!subscription.isExpired && subscription.daysRemaining <= 5) {
    return (
      <div className="bg-gradient-to-r from-[#f59e0b]/20 to-[#f59e0b]/10 border-b border-[#f59e0b]/30 px-4 py-2.5 text-xs text-[#f59e0b] font-mono flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#f59e0b] animate-spin" />
          <span>
            <strong>Aviso de suscripción:</strong> Tu periodo de acceso a canales de fútbol vencerá en{" "}
            <strong>{subscription.daysRemaining} {subscription.daysRemaining === 1 ? "día" : "días"}</strong>.
          </span>
        </div>
        <span className="text-[11px] underline opacity-80 cursor-pointer">
          Contacta a tu administrador para renovar +1 mes
        </span>
      </div>
    );
  }

  // Blocking banner when subscription is expired or suspended
  if (subscription.isExpired || subscription.status === "SUSPENDED") {
    return (
      <div className="bg-[#ef4444]/20 border-b border-[#ef4444]/40 px-4 py-3 text-xs text-[#ffb4ab] font-mono flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-[#ef4444] animate-bounce" />
          <div>
            <p className="font-bold text-[#ffb4ab]">
              {subscription.status === "SUSPENDED"
                ? "Suscripción Suspendida Temporalmente"
                : "Suscripción de Fútbol Vencida"}
            </p>
            <p className="text-[11px] text-[#bbcabf]">
              El reproductor de streaming se encuentra bloqueado hasta que el administrador renueve tu suscripción de 1 mes.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-1 px-3 py-1 bg-[#ef4444]/30 hover:bg-[#ef4444]/50 border border-[#ef4444]/50 rounded text-white text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verificar Estado</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
