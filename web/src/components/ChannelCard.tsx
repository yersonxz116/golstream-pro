import React from "react";
import { Channel } from "../types";
import { ChannelLogo } from "../utils/channelLogos";
import { Play, Heart, Activity } from "lucide-react";

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
      className={`group relative bg-[#1c1f29] hover:bg-[#262a34] border rounded-lg p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isCurrentPlaying
          ? "border-[#4edea3] shadow-lg shadow-[#4edea3]/20 ring-1 ring-[#4edea3]"
          : "border-[#262a34] hover:border-[#3c4a42]"
      }`}
    >
      {/* Top Bar: Live indicator + Favorite heart */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#0f131c] border border-[#262a34] text-[10px] font-mono font-bold text-[#4edea3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
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
          <Heart className={`w-3.5 h-3.5 ${channel.isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Center: Smart Channel Logo + Channel details */}
      <div className="flex items-center space-x-3 my-1">
        <ChannelLogo channel={channel} size="md" />

        <div className="min-w-0 flex-1">
          <h3 className="font-headline font-semibold text-sm text-white group-hover:text-[#4edea3] transition truncate">
            {channel.name}
          </h3>
          <p className="text-[11px] text-[#86948a] font-mono truncate">{channel.category}</p>
        </div>
      </div>

      {/* Bottom Bar: Action & Signal quality */}
      <div className="mt-3 pt-2.5 border-t border-[#262a34] flex items-center justify-between text-xs">
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
