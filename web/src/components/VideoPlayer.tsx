import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Channel } from "../types";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  X,
  AlertCircle,
  Radio,
  AudioLines,
} from "lucide-react";

interface VideoPlayerProps {
  channel: Channel;
  streamUrl: string;
  onClose: () => void;
}

interface QualityLevel {
  id: number;
  height: number;
  bitrate: number;
  label: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  streamUrl,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string }[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize or reload HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorMessage(null);
    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 3,
        liveDurationInfinity: true,
        backBufferLength: 30,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        maxBufferSize: 30 * 1000 * 1000,
        startFragPrefetch: true,
        testBandwidth: false,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 4,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 5,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        video.play().catch(() => {
          setIsPlaying(false);
        });

        // Parse quality levels
        if (data.levels && data.levels.length > 0) {
          const levels: QualityLevel[] = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
            label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
          }));
          setQualityLevels(levels);
        }

        // Parse audio tracks
        if (hls.audioTracks && hls.audioTracks.length > 0) {
          setAudioTracks(
            hls.audioTracks.map((t, index) => ({
              id: index,
              name: t.name || `Pista ${index + 1}`,
            }))
          );
        }
      });

      // Track level changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setCurrentQuality(data.level);
      });

      // Error handling and auto-reconnection
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn("[Hls Error]", data.type, data.details);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMessage("Pérdida de señal o corte de red. Reconectando...");
              setIsLoading(true);
              setTimeout(() => {
                hls.startLoad();
              }, 2000);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMessage("Error de decodificación. Recuperando flujo...");
              hls.recoverMediaError();
              break;
            default:
              setErrorMessage("Fallo crítico en el stream. Intenta recargar.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari / iOS fallback
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play().catch(() => setIsPlaying(false));
      });
    } else {
      setErrorMessage("Tu navegador no soporta reproducción HLS.");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, retryCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "Escape" && !isFullscreen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const selectQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex; // -1 for auto
    setCurrentQuality(levelIndex);
    setShowQualityMenu(false);
  };

  const selectAudioTrack = (trackId: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.audioTrack = trackId;
    setCurrentAudioTrack(trackId);
    setShowAudioMenu(false);
  };

  const handleManualRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-[#262a34] group"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        playsInline
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#0f131c]/90 border border-[#4edea3]/40 text-xs font-mono font-bold text-[#4edea3]">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span>TRANSMISIÓN EN VIVO</span>
          </div>
          <span className="font-headline font-bold text-base text-white drop-shadow">{channel.name}</span>
          <span className="text-xs text-[#86948a] font-mono hidden sm:inline">({channel.category})</span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white hover:text-[#ef4444] transition"
          title="Cerrar reproductor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <div className="w-12 h-12 border-4 border-[#1c1f29] border-t-[#4edea3] rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-mono text-[#4edea3]">Sintonizando señal de fútbol...</p>
        </div>
      )}

      {/* Error / Reconnect Banner */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#f59e0b] mb-2" />
          <p className="text-sm font-semibold text-white mb-1">{errorMessage}</p>
          <p className="text-xs text-[#86948a] font-mono mb-4">
            Reintentando conectar automáticamente al servidor IPTV...
          </p>
          <button
            onClick={handleManualRetry}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] rounded-lg text-xs font-bold transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Forzar Reconexión</span>
          </button>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="flex items-center justify-between text-white">
          {/* Left Controls: Play/Pause, Volume */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#4edea3] transition"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className="text-white hover:text-[#4edea3] transition">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 sm:w-28 h-1.5 bg-[#262a34] accent-[#4edea3] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Right Controls: Quality, Audio, Fullscreen */}
          <div className="flex items-center space-x-3">
            {/* Audio Track Menu */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  title="Pistas de Audio"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-black/60 hover:bg-black/90 border border-[#3c4a42] text-xs font-mono"
                >
                  <AudioLines className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Audio</span>
                </button>
                {showAudioMenu && (
                  <div className="absolute bottom-10 right-0 bg-[#1c1f29] border border-[#3c4a42] rounded-lg shadow-xl p-1 min-w-[140px] z-30 font-mono text-xs">
                    {audioTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => selectAudioTrack(track.id)}
                        className={`w-full text-left px-3 py-1.5 rounded transition ${
                          currentAudioTrack === track.id
                            ? "bg-[#4edea3]/20 text-[#4edea3] font-bold"
                            : "hover:bg-[#262a34] text-[#dfe2ef]"
                        }`}
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quality Selector Menu */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                title="Calidad de video"
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-black/60 hover:bg-black/90 border border-[#3c4a42] text-xs font-mono"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>
                  {currentQuality === -1
                    ? "Auto"
                    : qualityLevels.find((q) => q.id === currentQuality)?.label || "Calidad"}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-10 right-0 bg-[#1c1f29] border border-[#3c4a42] rounded-lg shadow-xl p-1 min-w-[120px] z-30 font-mono text-xs">
                  <button
                    onClick={() => selectQuality(-1)}
                    className={`w-full text-left px-3 py-1.5 rounded transition ${
                      currentQuality === -1
                        ? "bg-[#4edea3]/20 text-[#4edea3] font-bold"
                        : "hover:bg-[#262a34] text-[#dfe2ef]"
                    }`}
                  >
                    Auto (Adaptativo)
                  </button>
                  {qualityLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => selectQuality(lvl.id)}
                      className={`w-full text-left px-3 py-1.5 rounded transition ${
                        currentQuality === lvl.id
                          ? "bg-[#4edea3]/20 text-[#4edea3] font-bold"
                          : "hover:bg-[#262a34] text-[#dfe2ef]"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-white/10 text-white hover:text-[#4edea3] transition"
              title="Pantalla Completa (F)"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
