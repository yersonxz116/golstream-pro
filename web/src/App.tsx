import React, { useEffect, useState } from "react";
import { User, Subscription, Channel } from "./types";
import { api } from "./services/api";
import { Navbar } from "./components/Navbar";
import { SubscriptionAlert } from "./components/SubscriptionAlert";
import { ChannelCard } from "./components/ChannelCard";
import { VideoPlayer } from "./components/VideoPlayer";
import { AdminPanel } from "./components/AdminPanel";
import { LoginPage } from "./components/LoginPage";
import { Search, Heart, Radio, AlertCircle } from "lucide-react";

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
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-[#0f131c] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1c1f29] border-t-[#4edea3] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Derive categories
  const categories = ["TODOS", ...Array.from(new Set(channels.map((c) => c.category)))];

  const filteredChannels = channels.filter((c) => {
    const matchesCategory = selectedCategory === "TODOS" || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFavorite = !onlyFavorites || c.isFavorite;
    return matchesCategory && matchesSearch && matchesFavorite;
  });

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ef] flex flex-col">
      {/* Navbar */}
      <Navbar
        user={user}
        subscription={subscription}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        onLogout={handleLogout}
      />

      {/* Subscription Expiry / Block Warning Alert */}
      <SubscriptionAlert subscription={subscription} />

      {/* Main Content */}
      <main className="flex-1">
        {isAdminView && user.role === "admin" ? (
          <AdminPanel />
        ) : (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
            {/* Active Video Player Stage */}
            {activeChannel && streamUrl && (
              <section className="scroll-mt-20">
                <VideoPlayer
                  channel={activeChannel}
                  streamUrl={streamUrl}
                  onClose={() => {
                    setActiveChannel(null);
                    setStreamUrl(null);
                  }}
                />
              </section>
            )}

            {/* Error Notice */}
            {streamError && (
              <div className="p-4 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ffb4ab] text-xs font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#ef4444]" />
                  <span>{streamError}</span>
                </div>
                <button
                  onClick={() => setStreamError(null)}
                  className="underline hover:text-white"
                >
                  Entendido
                </button>
              </div>
            )}

            {/* Controls Bar: Search & Leagues Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2 border-b border-[#262a34]">
              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#86948a]" />
                <input
                  type="text"
                  placeholder="Buscar canal de fútbol (ESPN, DAZN, Liga)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1c1f29] border border-[#262a34] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#4edea3] transition font-mono"
                />
              </div>

              {/* Favorites toggle & stats */}
              <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                <button
                  onClick={() => setOnlyFavorites(!onlyFavorites)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                    onlyFavorites
                      ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40"
                      : "bg-[#1c1f29] text-[#86948a] border-[#262a34] hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-current" : ""}`} />
                  <span>Favoritos ({channels.filter((c) => c.isFavorite).length})</span>
                </button>

                <div className="flex items-center space-x-1.5 text-xs font-mono text-[#86948a]">
                  <Radio className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>{filteredChannels.length} Canales Disponibles</span>
                </div>
              </div>
            </div>

            {/* League Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? "bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3] font-bold"
                      : "bg-[#1c1f29] text-[#86948a] border-[#262a34] hover:text-white hover:border-[#3c4a42]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Channels Grid */}
            {filteredChannels.length === 0 ? (
              <div className="py-16 text-center text-xs font-mono text-[#86948a] border border-[#262a34] rounded-2xl bg-[#1c1f29]/30">
                <Radio className="w-8 h-8 mx-auto text-[#3c4a42] mb-2" />
                <p>No se encontraron canales de fútbol coincidentes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isCurrentPlaying={activeChannel?.id === channel.id}
                    onSelect={handleSelectChannel}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Technical Telemetry Footer (as specified in Stitch Design System) */}
      <footer className="bg-[#0f131c] border-t border-[#262a34] px-4 py-3 mt-12 text-center text-[11px] font-mono text-[#86948a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span>GolStream Core v0.1.0 • Strong IPTV Proxy: Activo</span>
          </div>
          <div>Cifrado AES-256-GCM • Sin Mixed Content • HLS Stream Engine</div>
        </div>
      </footer>
    </div>
  );
};
