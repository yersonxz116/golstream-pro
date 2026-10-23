import React, { useState } from "react";
import { api } from "../services/api";
import { User, Subscription } from "../types";
import { Tv, Shield, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: User, subscription: Subscription | null) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.login(email, password);
      onLoginSuccess(data.user, data.subscription);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#0f131c] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background stadium decorative glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#1c1f29] border border-[#262a34] rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-[#10b981] to-[#00422b] flex items-center justify-center shadow-lg shadow-[#10b981]/25 mb-4">
            <Tv className="w-8 h-8 text-[#0f131c]" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <h1 className="font-headline font-bold text-2xl text-white tracking-tight">GOLSTREAM</h1>
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-[#86948a] font-mono mt-1">Plataforma Strong IPTV Exclusiva de Fútbol</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ffb4ab] text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ef4444]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#dfe2ef] mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#86948a]" />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#4edea3] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#dfe2ef] mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#86948a]" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#4edea3] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] font-bold text-xs uppercase tracking-wider rounded-lg transition duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-[#4edea3]/20 disabled:opacity-50"
          >
            <span>{isLoading ? "Iniciando Sesión..." : "Entrar a GolStream"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick Access Buttons */}
        <div className="mt-8 pt-6 border-t border-[#262a34]">
          <p className="text-[11px] font-mono text-center text-[#86948a] mb-3">Acceso Rápido para Pruebas:</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@golstream.pro", "AdminSecurePassword2026!")}
              className="p-2 rounded bg-[#0f131c] hover:bg-[#262a34] border border-[#3c4a42] text-[#4edea3] transition flex items-center justify-center space-x-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("usuario@golstream.pro", "UserSecure123!")}
              className="p-2 rounded bg-[#0f131c] hover:bg-[#262a34] border border-[#3c4a42] text-white hover:text-[#4edea3] transition flex items-center justify-center space-x-1"
            >
              <span>Suscriptor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
