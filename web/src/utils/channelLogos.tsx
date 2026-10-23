import React, { useState } from "react";
import { Channel } from "../types";

export interface BrandTheme {
  name: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  badgeLabel: string;
}

export const BRAND_DICTIONARY: Record<string, BrandTheme> = {
  espn: {
    name: "ESPN",
    badgeBg: "linear-gradient(135deg, #d40000 0%, #800000 100%)",
    textColor: "#ffffff",
    borderColor: "#ff3333",
    accentColor: "#d40000",
    badgeLabel: "ESPN",
  },
  win_sports: {
    name: "Win Sports",
    badgeBg: "linear-gradient(135deg, #ff5500 0%, #c43800 100%)",
    textColor: "#ffffff",
    borderColor: "#ff7733",
    accentColor: "#ff5500",
    badgeLabel: "WIN",
  },
  dsports: {
    name: "DSPORTS",
    badgeBg: "linear-gradient(135deg, #0077c8 0%, #002244 100%)",
    textColor: "#ffffff",
    borderColor: "#00a3e0",
    accentColor: "#0077c8",
    badgeLabel: "DSPORTS",
  },
  fox_sports: {
    name: "Fox Sports",
    badgeBg: "linear-gradient(135deg, #002040 0%, #001020 100%)",
    textColor: "#ffcc00",
    borderColor: "#ffcc00",
    accentColor: "#ffcc00",
    badgeLabel: "FOX",
  },
  champions: {
    name: "Champions League",
    badgeBg: "linear-gradient(135deg, #071330 0%, #0f2b5c 100%)",
    textColor: "#ffffff",
    borderColor: "#4edea3",
    accentColor: "#4edea3",
    badgeLabel: "UCL",
  },
  dazn: {
    name: "DAZN",
    badgeBg: "linear-gradient(135deg, #181818 0%, #000000 100%)",
    textColor: "#f8ff00",
    borderColor: "#f8ff00",
    accentColor: "#f8ff00",
    badgeLabel: "DAZN",
  },
  movistar: {
    name: "Movistar+",
    badgeBg: "linear-gradient(135deg, #005c84 0%, #002b40 100%)",
    textColor: "#00e5ff",
    borderColor: "#00e5ff",
    accentColor: "#00e5ff",
    badgeLabel: "M+",
  },
  tnt: {
    name: "TNT Sports",
    badgeBg: "linear-gradient(135deg, #e5006d 0%, #7a0038 100%)",
    textColor: "#ffffff",
    borderColor: "#ff4da6",
    accentColor: "#e5006d",
    badgeLabel: "TNT",
  },
  tyc: {
    name: "TyC Sports",
    badgeBg: "linear-gradient(135deg, #003399 0%, #001a4d 100%)",
    textColor: "#ff3333",
    borderColor: "#3366ff",
    accentColor: "#003399",
    badgeLabel: "TyC",
  },
  sky: {
    name: "Sky Sports",
    badgeBg: "linear-gradient(135deg, #001f4d 0%, #990000 100%)",
    textColor: "#ffffff",
    borderColor: "#cc0000",
    accentColor: "#001f4d",
    badgeLabel: "SKY",
  },
  premier: {
    name: "Premier League",
    badgeBg: "linear-gradient(135deg, #38003c 0%, #150017 100%)",
    textColor: "#00ff85",
    borderColor: "#00ff85",
    accentColor: "#38003c",
    badgeLabel: "PL",
  },
  laliga: {
    name: "LaLiga",
    badgeBg: "linear-gradient(135deg, #e10034 0%, #85001e 100%)",
    textColor: "#ffffff",
    borderColor: "#ff5073",
    accentColor: "#e10034",
    badgeLabel: "LALIGA",
  },
};

export function detectBrandKey(channelName: string, categoryName?: string): string {
  const normName = `${channelName} ${categoryName || ""}`.toLowerCase();

  if (normName.includes("win sport") || normName.includes("win+") || normName.includes("winsport")) {
    return "win_sports";
  }
  if (
    normName.includes("dsport") ||
    normName.includes("directv") ||
    normName.includes("direct tv") ||
    normName.includes("dtv")
  ) {
    return "dsports";
  }
  if (normName.includes("espn") || normName.includes("star+")) {
    return "espn";
  }
  if (
    normName.includes("champions") ||
    normName.includes("ucl") ||
    normName.includes("campeones")
  ) {
    return "champions";
  }
  if (normName.includes("dazn")) {
    return "dazn";
  }
  if (normName.includes("fox sport") || normName.includes("fox news")) {
    return "fox_sports";
  }
  if (normName.includes("movistar") || normName.includes("m+")) {
    return "movistar";
  }
  if (normName.includes("tnt sport") || normName.includes("tnt")) {
    return "tnt";
  }
  if (normName.includes("tyc")) {
    return "tyc";
  }
  if (normName.includes("sky sport")) {
    return "sky";
  }
  if (normName.includes("premier")) {
    return "premier";
  }
  if (normName.includes("laliga") || normName.includes("copa del rey")) {
    return "laliga";
  }

  return "generic";
}

export function isInvalidLogoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return true;
  if (trimmed.includes("51.158.145.100")) return true; // Dead IP
  if (trimmed.includes("picons.cmshulk.com")) return true; // 404 domain
  return false;
}

function extractSuffix(name: string): string {
  if (name.includes("+") || name.toLowerCase().includes("plus")) return "+";
  const match = name.match(/\b([1-8])\b/);
  if (match) return match[1];
  if (name.toLowerCase().includes("premium")) return "PLUS";
  if (name.toLowerCase().includes("extra")) return "EXTRA";
  if (name.toLowerCase().includes("4k")) return "4K";
  return "";
}

/**
 * Authentic Vector Badges for Broadcast Channels
 */
export const BrandBadge: React.FC<{
  brandKey: string;
  channelName: string;
  size?: "sm" | "md" | "lg";
}> = ({ brandKey, channelName, size = "md" }) => {
  const brand = BRAND_DICTIONARY[brandKey];
  const suffix = extractSuffix(channelName);

  const containerSizes = {
    sm: "w-8 h-8 rounded-md",
    md: "w-10 h-10 rounded-lg",
    lg: "w-14 h-14 rounded-xl",
  }[size];

  // 1. DSPORTS (DIRECTV Sports)
  if (brandKey === "dsports") {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans tracking-tight border border-[#00a3e0]/50 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <div className="flex items-center space-x-0.5">
          <span className="text-[#00e5ff] text-[11px] font-black leading-none drop-shadow">D</span>
          <span className="text-white text-[9px] font-black tracking-tighter leading-none">SPORTS</span>
        </div>
        {suffix && (
          <span className="text-[8px] text-[#00e5ff] font-mono font-bold mt-0.5 leading-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  // 2. WIN SPORTS / WIN SPORTS+
  if (brandKey === "win_sports") {
    const isPlus = suffix === "+" || channelName.toLowerCase().includes("plus");
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans tracking-tight border border-[#ff7733]/60 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <div className="flex items-center space-x-0.5">
          <span className="text-white text-[12px] font-black italic leading-none tracking-tight">
            WIN
          </span>
          {isPlus && (
            <span className="text-[#ffe066] text-[12px] font-black leading-none drop-shadow">
              +
            </span>
          )}
        </div>
        <span className="text-[6.5px] text-white/95 font-mono tracking-widest font-black uppercase mt-0.5 leading-none">
          SPORTS {suffix && !isPlus ? suffix : ""}
        </span>
      </div>
    );
  }

  // 3. ESPN / STAR+
  if (brandKey === "espn") {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans font-black italic tracking-tighter border border-[#ff3333]/60 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <div className="flex items-center">
          <span className="text-white text-[12px] font-black tracking-tighter leading-none drop-shadow">
            ESPN
          </span>
          {suffix && (
            <span className="text-[#ffeb3b] text-[10px] font-mono font-black not-italic ml-0.5 leading-none">
              {suffix}
            </span>
          )}
        </div>
        <span className="text-[6.5px] text-[#ffb4ab] not-italic font-mono font-bold tracking-wider mt-0.5 leading-none">
          DEPORTES
        </span>
      </div>
    );
  }

  // 4. UEFA CHAMPIONS LEAGUE
  if (brandKey === "champions") {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans font-black tracking-tight border border-[#4edea3]/50 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <div className="text-[#4edea3] text-[9px] font-bold leading-none mb-0.5">
          ★ ★ ★
        </div>
        <div className="flex items-center space-x-0.5">
          <span className="text-white text-[10px] font-black leading-none tracking-wider">UCL</span>
          {suffix && (
            <span className="text-[#4edea3] text-[9px] font-mono font-bold leading-none">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 5. FOX SPORTS
  if (brandKey === "fox_sports") {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans tracking-normal border border-[#ffcc00]/50 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <span className="text-[#ffcc00] text-[11px] font-black leading-none tracking-wider">
          FOX
        </span>
        <span className="text-[7px] text-white font-mono font-bold uppercase mt-0.5 leading-none">
          {suffix ? `SPORTS ${suffix}` : "SPORTS"}
        </span>
      </div>
    );
  }

  // 6. DAZN
  if (brandKey === "dazn") {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans font-black tracking-wider border border-[#f8ff00]/50 shadow-md select-none flex-shrink-0 relative overflow-hidden`}
        style={{ background: brand.badgeBg }}
      >
        <span className="text-[#f8ff00] text-[11px] font-black leading-none">DAZN</span>
        {suffix && (
          <span className="text-[7.5px] text-white font-mono font-bold mt-0.5 leading-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  // 7. Other Branded Channels
  if (brand) {
    return (
      <div
        className={`${containerSizes} flex flex-col items-center justify-center font-sans font-bold border shadow-md select-none flex-shrink-0`}
        style={{
          background: brand.badgeBg,
          borderColor: brand.borderColor,
          color: brand.textColor,
        }}
      >
        <span className="text-[10px] font-extrabold leading-none">{brand.badgeLabel}</span>
        {suffix && (
          <span className="text-[7.5px] font-mono opacity-90 mt-0.5 leading-none">{suffix}</span>
        )}
      </div>
    );
  }

  // 8. Elegant Generic Fallback with Monogram Initials
  const cleanName = channelName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : cleanName.slice(0, 3).toUpperCase() || "TV";

  return (
    <div
      className={`${containerSizes} flex flex-col items-center justify-center font-mono font-bold border border-[#3c4a42] text-[#4edea3] bg-gradient-to-br from-[#1c1f29] to-[#0f131c] shadow-inner select-none flex-shrink-0`}
    >
      <span className="text-[10px] tracking-wider">{initials}</span>
      <span className="text-[6.5px] text-[#86948a] font-normal leading-none mt-0.5">LIVE</span>
    </div>
  );
};

/**
 * Smart Channel Logo Component
 */
export const ChannelLogo: React.FC<{
  channel: Channel;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ channel, size = "md", className = "" }) => {
  const [hasError, setHasError] = useState(false);
  const brandKey = detectBrandKey(channel.name, channel.category);
  const isDeadUrl = isInvalidLogoUrl(channel.logoUrl);

  const containerSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  }[size];

  // If URL is dead, empty or failed, show the authentic vector badge
  if (isDeadUrl || hasError || !channel.logoUrl) {
    return (
      <div className={`${containerSizes} ${className} flex-shrink-0 flex items-center justify-center`}>
        <BrandBadge brandKey={brandKey} channelName={channel.name} size={size} />
      </div>
    );
  }

  return (
    <div
      className={`${containerSizes} ${className} rounded-lg bg-[#0f131c] border border-[#262a34] flex items-center justify-center p-1 overflow-hidden flex-shrink-0 relative`}
    >
      <img
        src={channel.logoUrl}
        alt={channel.name}
        loading="lazy"
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
