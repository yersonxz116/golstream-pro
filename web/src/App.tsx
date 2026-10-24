import React, { useEffect, useState } from "react";
import { User, Subscription, Channel } from "./types";
import { api } from "./services/api";
import { Navbar } from "./components/Navbar";
import { SubscriptionAlert } from "./components/SubscriptionAlert";
import { VideoPlayer } from "./components/VideoPlayer";
import { AdminPanel } from "./components/AdminPanel";
import { LoginPage } from "./components/LoginPage";
import { ChannelSidebar } from "./components/ChannelSidebar";
import { ChannelLogo } from "./utils/channelLogos";
import {
  Play,
  Heart,
  Radio,
  AlertCircle,
  Activity,
  Shield,
  Layers,
  PanelLeftOpen,
} from "lucide-react";

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // View state
  const [isAdminView, setIsAdminView] = useState(false);

  // Channels & Filter state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Sidebar toggle state (defaults to open on desktop, closed on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  // Streaming state
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();

    // Handle resize to adjust sidebar
    const handleResize = () => {
      if (window.innerWidth < 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setSubscription(data.subscription);
      loadChannels();
    } catch {
      setUser(null);
      setSubscription(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadChannels = async () => {
    try {
      const list = await api.getChannels();
      setChannels(list);

      // Auto-select and boot stream for first priority channel if none is active
      if (list.length > 0 && !activeChannel) {
        const priorityChannel = list[0];
        handleSelectChannel(priorityChannel);
      }
    } catch (err: unknown) {
      console.error("Error loading channels:", err);
    }
  };

  const handleLoginSuccess = (loggedInUser: User, userSub: Subscription | null) => {
    setUser(loggedInUser);
    setSubscription(userSub);
    loadChannels();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSubscription(null);
    setActiveChannel(null);
    setStreamUrl(null);
  };

  const handleSelectChannel = async (channel: Channel) => {
    setStreamError(null);

    // Check subscription before loading player
    if (user?.role !== "admin" && (!subscription || subscription.isExpired || subscription.status === "SUSPENDED")) {
      setStreamError("Tu suscripción se encuentra vencida o inactiva. Contacta al administrador para renovar tu acceso.");
      return;
    }

    try {
      const res = await api.getStreamToken(channel.id);
      setActiveChannel(channel);
      setStreamUrl(res.streamUrl);
    } catch (err: unknown) {
      setStreamError(err instanceof Error ? err.message : "Error al obtener la señal del canal.");
    }
  };

  const handleToggleFavorite = async (channelId: string) => {
    try {
      const res = await api.toggleFavorite(channelId);
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, isFavorite: res.isFavorite } : c))
      );
      if (activeChannel?.id === channelId) {
        setActiveChannel((prev) => (prev ? { ...prev, isFavorite: res.isFavorite } : null));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#4edea3] rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#86948a] tracking-wider">Cargando GolStream Pro...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-[#080b12] text-[#dfe2ef] flex flex-col overflow-hidden relative selection:bg-[#10b981] selection:text-[#090d16]">
      {/* Ambient pitch lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.07),rgba(255,255,255,0))]"></div>

      {/* Top Navbar */}
      <Navbar
        user={user}
        subscription={subscription}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Subscription Expiry / Block Warning Alert */}
      <SubscriptionAlert subscription={subscription} />

      {/* Main Workspace: Admin Panel OR Split Broadcast Studio with Translucent Collapsible Sidebar */}
      {isAdminView && user.role === "admin" ? (
        <main className="flex-1 overflow-y-auto z-10">
          <AdminPanel />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden relative z-10">
          {/* 
            Translucent Vertical Channel Sidebar
            - Hideable / Collapsible
            - Glassmorphism effect: backdrop-blur-2xl bg-[#090d16]/80 border-r border-white/[0.08]
            - Purely vertical, no horizontal bars
          */}
          <ChannelSidebar
            channels={channels}
            activeChannel={activeChannel}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onlyFavorites={onlyFavorites}
            onToggleFavoritesOnly={() => setOnlyFavorites(!onlyFavorites)}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Stage: Expansive Cinema Player & Telemetry */}
          <main className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10 relative transition-all duration-300">
            {/* 
              Floating Re-Open Trigger 
              Appears smoothly when sidebar is hidden on desktop or mobile
            */}
            {!isSidebarOpen && (
              <div className="sticky top-0 z-30 flex items-center justify-between pb-1">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#090d16]/85 hover:bg-[#090d16] border border-white/10 text-white backdrop-blur-xl shadow-2xl transition hover:border-[#4edea3]/40 group"
                  title="Abrir panel de canales"
                >
                  <PanelLeftOpen className="w-4 h-4 text-[#4edea3] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-mono font-bold tracking-wide">
                    Canales ({channels.length})
                  </span>
                </button>

                {activeChannel && (
                  <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-[#86948a] bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                    <span className="text-white font-semibold truncate max-w-xs">{activeChannel.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Notice */}
            {streamError && (
              <div className="p-3.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ffb4ab] text-xs font-mono flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ef4444]" />
                  <span>{streamError}</span>
                </div>
                <button
                  onClick={() => setStreamError(null)}
                  className="underline hover:text-white ml-2 text-xs"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Cinema Video Player Stage */}
            {activeChannel && streamUrl ? (
              <div className="w-full max-w-6xl mx-auto space-y-4 transition-all">
                {/* 16:9 Cinema Container */}
                <div className="w-full bg-black rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.8)] border border-white/[0.08]">
                  <VideoPlayer
                    channel={activeChannel}
                    streamUrl={streamUrl}
                    onClose={() => {
                      setActiveChannel(null);
                      setStreamUrl(null);
                    }}
                  />
                </div>

                {/* Stream Info Bar (Translucent Glassmorphism) */}
                <div className="bg-[#0e1320]/70 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  {/* Left: Active Channel Badge & Title */}
                  <div className="flex items-center space-x-3.5">
                    <ChannelLogo channel={activeChannel} size="lg" />

                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-base sm:text-lg font-headline font-bold text-white tracking-wide">
                          {activeChannel.name}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[#4edea3] text-[10px] font-mono font-bold">
                          EN VIVO
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-[#86948a]">
                        <span className="text-[#dfe2ef]">{activeChannel.category}</span>
                        <span>•</span>
                        <span className="flex items-center text-[#10b981]">
                          <Activity className="w-3 h-3 mr-1" />
                          1080p 60FPS
                        </span>
                        <span>•</span>
                        <span className="flex items-center text-[#38bdf8]">
                          <Shield className="w-3 h-3 mr-1" />
                          HLS Direct Tunnel
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => handleToggleFavorite(activeChannel.id)}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono transition border ${
                        activeChannel.isFavorite
                          ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40 font-bold"
                          : "bg-white/[0.04] hover:bg-white/[0.08] text-[#86948a] hover:text-white border-white/[0.08]"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${activeChannel.isFavorite ? "fill-current" : ""}`}
                      />
                      <span>
                        {activeChannel.isFavorite ? "En Favoritos" : "Añadir a Favoritos"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Telemetry & Technical Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[#0e1320]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">LATENCIA TRANSMISIÓN</p>
                      <p className="text-xs font-mono font-bold text-white">&lt; 1.5s (Ultra Low-Latency)</p>
                    </div>
                  </div>

                  <div className="bg-[#0e1320]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">SERVIDOR TUNNEL</p>
                      <p className="text-xs font-mono font-bold text-white">Proxy Keep-Alive Activo</p>
                    </div>
                  </div>

                  <div className="bg-[#0e1320]/60 backdrop-blur-xl border border-white/[0.06] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#a855f7]/15 text-[#a855f7] border border-[#a855f7]/30">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">CALIDAD DE SEÑAL</p>
                      <p className="text-xs font-mono font-bold text-white">1080p60 Multi-Track Audio</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Idle / No Channel Selected Hero */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center shadow-2xl">
                  <Radio className="w-8 h-8 text-[#4edea3] animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-white">
                    Estudio de Transmisión Listo
                  </h2>
                  <p className="text-xs font-mono text-[#86948a] mt-1">
                    Abre el sidebar para explorar los canales y sintonizar en vivo.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#4edea3] hover:to-[#10b981] text-[#090d16] rounded-xl text-xs font-mono font-bold shadow-lg shadow-[#10b981]/25 transition"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                    <span>Explorar Canales</span>
                  </button>

                  {channels.length > 0 && (
                    <button
                      onClick={() => handleSelectChannel(channels[0])}
                      className="flex items-center space-x-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/10 rounded-xl text-xs font-mono font-semibold transition"
                    >
                      <Play className="w-3.5 h-3.5 text-[#4edea3] fill-current" />
                      <span>{channels[0].name}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
