import React from "react";
import { Channel } from "../types";
import { Play, Heart, Radio, Activity } from "lucide-react";

interface ChannelCardProps {
  channel: Channel;
  isCurrentPlaying: boolean;
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isCurrentPlaying,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <div
      onClick={() => onSelect(channel)}
      className={`group relative bg-[#1c1f29] hover:bg-[#262a34] border rounded-lg p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isCurrentPlaying
          ? "border-[#4edea3] shadow-lg shadow-[#4edea3]/20 ring-1 ring-[#4edea3]"
          : "border-[#262a34] hover:border-[#3c4a42]"
      }`}
    >
      {/* Top Bar: Live indicator + Favorite heart */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#0f131c] border border-[#262a34] text-[10px] font-mono font-bold text-[#4edea3]">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
          <span>EN VIVO</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel.id);
          }}
          title={channel.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          className={`p-1.5 rounded-full transition ${
            channel.isFavorite
              ? "text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20"
              : "text-[#86948a] hover:text-white bg-[#0f131c]/60"
          }`}
        >
          <Heart className={`w-4 h-4 ${channel.isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Center: Channel Logo or Stadium fallback */}
      <div className="flex items-center space-x-3 my-2">
        <div className="w-12 h-12 rounded-lg bg-[#0f131c] border border-[#3c4a42] flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
          {channel.logoUrl ? (
            <img
              src={channel.logoUrl}
              alt={channel.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon if logo fails to load
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <Radio className="w-6 h-6 text-[#4edea3]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline font-semibold text-sm text-white group-hover:text-[#4edea3] transition truncate">
            {channel.name}
          </h3>
          <p className="text-[11px] text-[#86948a] font-mono truncate">{channel.category}</p>
        </div>
      </div>

      {/* Bottom Bar: Action & Signal quality */}
      <div className="mt-3 pt-3 border-t border-[#262a34] flex items-center justify-between text-xs">
        <span className="text-[10px] font-mono text-[#86948a] flex items-center">
          <Activity className="w-3 h-3 text-[#10b981] mr-1" />
          FHD 60FPS
        </span>
        <div className="flex items-center text-xs font-semibold text-[#4edea3] group-hover:translate-x-0.5 transition">
          <Play className="w-3 h-3 mr-1 fill-current" />
          <span>{isCurrentPlaying ? "Reproduciendo" : "Ver Canal"}</span>
        </div>
      </div>
    </div>
  );
};
