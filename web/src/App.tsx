import React, { useEffect, useState, useMemo } from "react";
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
  Sparkles,
  ListVideo,
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

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Streaming state
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
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

      // Auto-select and load stream for the first priority channel if none is active
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

  // Quick switch suggestions (top channels or channels in the same category)
  const quickSwitchChannels = useMemo(() => {
    if (!activeChannel) return channels.slice(0, 6);
    return channels
      .filter((c) => c.category === activeChannel.category && c.id !== activeChannel.id)
      .slice(0, 6);
  }, [channels, activeChannel]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#1c1f29] border-t-[#4edea3] rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-[#86948a] tracking-wider">Cargando GolStream Pro...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-screen bg-[#0a0d14] text-[#dfe2ef] flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        user={user}
        subscription={subscription}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarOpen={isMobileSidebarOpen}
      />

      {/* Subscription Expiry / Block Warning Alert */}
      <SubscriptionAlert subscription={subscription} />

      {/* Main Workspace: Admin Panel OR Split Broadcast Studio with Responsive Sidebar */}
      {isAdminView && user.role === "admin" ? (
        <main className="flex-1 overflow-y-auto">
          <AdminPanel />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Responsive Channels Sidebar */}
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
            isOpenMobile={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Stage: Cinema Video Player & Broadcast Dashboard */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-[#080b11] p-3 sm:p-5 lg:p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#1e2330]">
            {/* Mobile Channel Bar trigger */}
            <div className="flex items-center justify-between lg:hidden bg-[#121620] p-2.5 rounded-xl border border-[#262a34]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-white truncate">
                  {activeChannel ? activeChannel.name : "Selecciona un canal"}
                </span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border border-[#4edea3]/40 rounded-lg text-xs font-mono font-bold transition"
              >
                <ListVideo className="w-3.5 h-3.5" />
                <span>Explorar Canales</span>
              </button>
            </div>

            {/* Error Notice */}
            {streamError && (
              <div className="p-3.5 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ffb4ab] text-xs font-mono flex items-center justify-between">
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
              <div className="w-full max-w-6xl mx-auto space-y-4">
                {/* 16:9 Cinema Container */}
                <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#262a34]">
                  <VideoPlayer
                    channel={activeChannel}
                    streamUrl={streamUrl}
                    onClose={() => {
                      setActiveChannel(null);
                      setStreamUrl(null);
                    }}
                  />
                </div>

                {/* Stream Info Bar */}
                <div className="bg-[#121620] border border-[#262a34] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Active Channel Badge & Title */}
                  <div className="flex items-center space-x-3.5">
                    <ChannelLogo channel={activeChannel} size="lg" />

                    <div>
                      <div className="flex items-center space-x-2">
                        <h1 className="text-base sm:text-lg font-headline font-bold text-white tracking-wide">
                          {activeChannel.name}
                        </h1>
                        <span className="px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] text-[10px] font-mono font-bold">
                          EN VIVO
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-[#86948a]">
                        <span className="text-[#dfe2ef]">{activeChannel.category}</span>
                        <span>•</span>
                        <span className="flex items-center text-[#10b981]">
                          <Activity className="w-3 h-3 mr-1" />
                          FHD 60FPS
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
                          : "bg-[#1c1f29] hover:bg-[#262a34] text-[#86948a] hover:text-white border-[#262a34]"
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
                  <div className="bg-[#121620] border border-[#262a34] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#4edea3]/10 text-[#4edea3]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">LATENCIA TRANSMISIÓN</p>
                      <p className="text-xs font-mono font-bold text-white">&lt; 1.5s (Ultra Low-Latency)</p>
                    </div>
                  </div>

                  <div className="bg-[#121620] border border-[#262a34] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8]">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">SERVIDOR TUNNEL</p>
                      <p className="text-xs font-mono font-bold text-white">Proxy Keep-Alive Activo</p>
                    </div>
                  </div>

                  <div className="bg-[#121620] border border-[#262a34] rounded-xl p-3 flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-[#a855f7]/10 text-[#a855f7]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#86948a]">CALIDAD DE SEÑAL</p>
                      <p className="text-xs font-mono font-bold text-white">1080p60 Multi-Track Audio</p>
                    </div>
                  </div>
                </div>

                {/* Quick Switch Recommendations (Channels from same category) */}
                {quickSwitchChannels.length > 0 && (
                  <div className="bg-[#121620] border border-[#262a34] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-[#4edea3]" />
                      <h3 className="text-xs font-headline font-bold text-white uppercase tracking-wider">
                        Más señales de {activeChannel.category}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {quickSwitchChannels.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectChannel(c)}
                          className="flex flex-col items-center p-2.5 rounded-xl bg-[#1c1f29] hover:bg-[#262a34] border border-[#262a34] hover:border-[#4edea3]/40 transition text-center group"
                        >
                          <ChannelLogo channel={c} size="sm" className="mb-1.5" />
                          <span className="text-[11px] font-headline font-semibold text-white group-hover:text-[#4edea3] truncate w-full">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Idle / No Channel Selected Hero */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#121620] border border-[#262a34] flex items-center justify-center shadow-xl">
                  <Radio className="w-8 h-8 text-[#4edea3] animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-headline font-bold text-white">
                    Estudio de Transmisión Listo
                  </h2>
                  <p className="text-xs font-mono text-[#86948a] mt-1">
                    Selecciona un canal del sidebar para comenzar a ver en vivo.
                  </p>
                </div>

                {channels.length > 0 && (
                  <button
                    onClick={() => handleSelectChannel(channels[0])}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#4edea3] hover:to-[#10b981] text-[#003824] rounded-xl text-xs font-mono font-bold shadow-lg shadow-[#10b981]/25 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Sintonizar {channels[0].name}</span>
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
