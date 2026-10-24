import React, { useMemo, useState } from "react";
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
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Filter,
  Flame,
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
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
}) => {
  // State for collapsible vertical category list in sidebar
  const [isCategoryListExpanded, setIsCategoryListExpanded] = useState(false);

  // Group categories with channel count
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    channels.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });

    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));

    return [{ name: "TODOS", count: channels.length }, ...list];
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
      {/* Mobile Backdrop (when drawer is open on mobile screens) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 
        Glassmorphic Translucent Vertical Sidebar 
        - Fully hideable with smooth translate / width collapse
        - Frosted glass effect: backdrop-blur-2xl bg-[#090d16]/75 border-r border-white/[0.08]
        - Strictly vertical layout (no horizontal pills or horizontal strips)
      */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 z-50 lg:z-10 flex flex-col h-full transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 w-[340px] sm:w-[380px] xl:w-[400px] opacity-100"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 overflow-hidden pointer-events-none"
        } bg-[#090d16]/80 backdrop-blur-2xl border-r border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] select-none`}
      >
        {/* Top HUD: Title, Live indicator & Collapse button */}
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#4edea3] shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-headline font-bold text-sm tracking-wide text-white">
                  CANALES EN VIVO
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              </div>
              <p className="text-[11px] font-mono text-[#86948a]">
                {filteredChannels.length} señales activas
              </p>
            </div>
          </div>

          {/* Ocultar / Collapse Sidebar Button */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#86948a] hover:text-white border border-white/[0.08] transition text-xs font-mono group"
            title="Ocultar sidebar de canales"
          >
            <PanelLeftClose className="w-4 h-4 text-[#4edea3] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Ocultar</span>
          </button>
        </div>

        {/* Vertical Search & Filtering Controls */}
        <div className="p-3.5 space-y-2.5 border-b border-white/[0.06] bg-black/20">
          {/* Glassmorphic Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#86948a]" />
            <input
              type="text"
              placeholder="Buscar canal (ESPN, DSPORTS, Win...)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/40 transition font-mono backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-2.5 text-[#86948a] hover:text-white p-0.5"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vertical Category Dropdown / Accordion Trigger */}
          <div className="space-y-1.5">
            <button
              onClick={() => setIsCategoryListExpanded(!isCategoryListExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono transition text-left"
            >
              <div className="flex items-center space-x-2 truncate">
                <Filter className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                <span className="text-[#86948a]">Categoría:</span>
                <span className="text-white font-semibold truncate">{selectedCategory}</span>
              </div>
              <div className="flex items-center space-x-1 text-[#86948a] flex-shrink-0">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06]">
                  {categoryStats.find((c) => c.name === selectedCategory)?.count || channels.length}
                </span>
                {isCategoryListExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#4edea3]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {/* Expandable Vertical Category List */}
            {isCategoryListExpanded && (
              <div className="max-h-56 overflow-y-auto space-y-1 p-1 bg-[#090d16]/95 border border-white/[0.1] rounded-xl shadow-2xl backdrop-blur-2xl scrollbar-thin scrollbar-thumb-white/10 animate-in fade-in zoom-in-95 duration-150">
                {categoryStats.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => {
                        onSelectCategory(cat.name);
                        setIsCategoryListExpanded(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition text-left ${
                        isSelected
                          ? "bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/40 font-bold"
                          : "hover:bg-white/[0.05] text-[#dfe2ef]"
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span className="text-[10px] opacity-70 px-1 rounded bg-black/40">
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Favorites Filter Switch */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs font-mono">
            <span className="text-[#86948a] flex items-center space-x-1.5">
              <Heart
                className={`w-3.5 h-3.5 ${
                  onlyFavorites ? "text-[#ef4444] fill-current" : "text-[#86948a]"
                }`}
              />
              <span>Ver solo Favoritos</span>
            </span>

            <button
              onClick={onToggleFavoritesOnly}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                onlyFavorites ? "bg-[#ef4444]" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  onlyFavorites ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 
          Vertical Channel List (Pure Vertical Stream)
          - No horizontal scrolling elements
          - Translucent row items with Stitch glassmorphism
        */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-thumb-white/10">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#86948a] space-y-3">
              <Radio className="w-8 h-8 mx-auto text-white/20" />
              <p>No se encontraron canales coincidentes.</p>
              {onlyFavorites && (
                <button
                  onClick={onToggleFavoritesOnly}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-[#4edea3] hover:text-white border border-white/10"
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
                    // On mobile screens, close drawer automatically after selection
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between p-3 transition-all duration-150 cursor-pointer ${
                    isPlaying
                      ? "bg-[#10b981]/15 border-l-4 border-l-[#4edea3] shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
                      : "hover:bg-white/[0.05] border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Left: Smart Vector Logo & Channel Metadata */}
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

                  {/* Right: Playing Soundwaves / Favorite Toggle */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {isPlaying ? (
                      <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[9px] font-mono font-bold border border-[#4edea3]/30 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        <span>VIVO</span>
                      </div>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition p-1 text-[#86948a] hover:text-[#4edea3]">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {/* Favorite Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      title={channel.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                      className={`p-1.5 rounded-lg transition ${
                        channel.isFavorite
                          ? "text-[#ef4444] hover:text-[#ef4444]/80"
                          : "text-[#86948a] hover:text-white hover:bg-white/[0.08]"
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

        {/* Sidebar Footer Telemetry */}
        <div className="p-3 border-t border-white/[0.08] bg-black/40 backdrop-blur-md flex items-center justify-between text-[10px] font-mono text-[#86948a]">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
            <span>HLS Low-Latency Engine</span>
          </span>
          <span className="text-[#dfe2ef]/80 font-bold">GolStream Pro</span>
        </div>
      </aside>
    </>
  );
};
