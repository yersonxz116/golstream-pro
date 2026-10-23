import React, { useMemo } from "react";
import { Channel } from "../types";
import { ChannelLogo } from "../utils/channelLogos";
import {
  Search,
  Heart,
  Radio,
  X,
  Play,
  Volume2,
  Tv,
  Filter,
} from "lucide-react";

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onlyFavorites: boolean;
  onToggleFavoritesOnly: () => void;
  onSelectChannel: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  activeChannel,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onlyFavorites,
  onToggleFavoritesOnly,
  onSelectChannel,
  onToggleFavorite,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Extract unique categories preserving priority order
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => set.add(c.category));
    return ["TODOS", ...Array.from(set)];
  }, [channels]);

  // Filter channels based on search, category, and favorites
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesCategory = selectedCategory === "TODOS" || c.category === selectedCategory;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFavorite = !onlyFavorites || c.isFavorite;
      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [channels, selectedCategory, searchQuery, onlyFavorites]);

  const favoritesCount = useMemo(() => {
    return channels.filter((c) => c.isFavorite).length;
  }, [channels]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 lg:z-auto w-[330px] sm:w-[380px] lg:w-[380px] xl:w-[400px] flex-shrink-0 bg-[#121620] border-r border-[#262a34] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } h-full max-h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-[#262a34] space-y-3 bg-[#0f131c]">
          {/* Header Title & Mobile Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3]">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-headline font-bold text-white tracking-wide">
                  Canales en Vivo
                </h2>
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#86948a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                  <span>{filteredChannels.length} disponibles</span>
                </div>
              </div>
            </div>

            {/* Close button for Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#86948a] hover:text-white hover:bg-[#1c1f29] transition"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#86948a]" />
            <input
              type="text"
              placeholder="Buscar canal (ESPN, DSPORTS, Win...)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#1c1f29] border border-[#262a34] rounded-lg pl-8 pr-7 py-2 text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3] transition font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-2.5 text-[#86948a] hover:text-white"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters: Favorites toggle & Categories Dropdown/Scroll */}
          <div className="flex items-center space-x-2">
            {/* Favorites Toggle Button */}
            <button
              onClick={onToggleFavoritesOnly}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition border ${
                onlyFavorites
                  ? "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40 font-bold"
                  : "bg-[#1c1f29] text-[#86948a] border-[#262a34] hover:text-white"
              }`}
              title="Filtrar canales favoritos"
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-current" : ""}`} />
              <span>Favs ({favoritesCount})</span>
            </button>

            {/* Category Select Dropdown for quick jump */}
            <div className="relative flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => onSelectCategory(e.target.value)}
                className="w-full appearance-none bg-[#1c1f29] border border-[#262a34] text-white text-xs font-mono rounded-lg px-2.5 py-1.5 pr-6 truncate focus:outline-none focus:border-[#4edea3]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 absolute right-2 top-2.5 text-[#86948a] pointer-events-none" />
            </div>
          </div>

          {/* Category Quick Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-0.5 text-[11px] font-mono">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition border ${
                  selectedCategory === cat
                    ? "bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3] font-semibold"
                    : "bg-[#1c1f29] text-[#86948a] border-[#262a34] hover:text-white"
                }`}
              >
                {cat.length > 20 ? cat.slice(0, 18) + "..." : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Channels List (Scrollable) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e2330] scrollbar-thin scrollbar-thumb-[#262a34]">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#86948a]">
              <Radio className="w-8 h-8 mx-auto text-[#262a34] mb-2" />
              <p>No se encontraron canales coincidentes.</p>
              {onlyFavorites && (
                <button
                  onClick={onToggleFavoritesOnly}
                  className="mt-3 text-[#4edea3] underline hover:text-white"
                >
                  Ver todos los canales
                </button>
              )}
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isPlaying = activeChannel?.id === channel.id;

              return (
                <div
                  key={channel.id}
                  onClick={() => {
                    onSelectChannel(channel);
                    // On mobile screens, close drawer upon channel selection so video is visible
                    if (window.innerWidth < 1024) {
                      onCloseMobile();
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2.5 transition-all duration-150 cursor-pointer ${
                    isPlaying
                      ? "bg-[#4edea3]/10 border-l-4 border-l-[#4edea3] pl-2"
                      : "hover:bg-[#1a202c] border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Left: Channel Logo + Channel Info */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                    <ChannelLogo channel={channel} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-xs font-headline font-semibold truncate transition ${
                            isPlaying
                              ? "text-[#4edea3] font-bold"
                              : "text-white group-hover:text-[#4edea3]"
                          }`}
                        >
                          {channel.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#86948a] mt-0.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                        <span className="truncate">{channel.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Playing Indicator / Favorite Action */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {isPlaying ? (
                      <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[9px] font-mono font-bold">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                        <span className="hidden sm:inline">VIVO</span>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition p-1 text-[#86948a] hover:text-[#4edea3]">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      title={channel.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                      className={`p-1.5 rounded-lg transition ${
                        channel.isFavorite
                          ? "text-[#ef4444] hover:text-[#ef4444]/80"
                          : "text-[#86948a] hover:text-white hover:bg-[#262a34]"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${channel.isFavorite ? "fill-current" : ""}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer telemetry */}
        <div className="p-2.5 border-t border-[#262a34] bg-[#0c0f16] flex items-center justify-between text-[10px] font-mono text-[#86948a]">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            <span>HLS Low-Latency</span>
          </span>
          <span>GolStream Engine</span>
        </div>
      </aside>
    </>
  );
};
