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

  // Anti-Freeze & Playback tracking
  const isUserPausedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const frozenTicksRef = useRef<number>(0);
  const waitingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [mutedByPolicy, setMutedByPolicy] = useState(false);
  const [liveLatency, setLiveLatency] = useState<number>(0);

  // Jump directly to the real-time live edge (elimina cualquier retraso acumulado)
  const syncToLive = () => {
    const video = videoRef.current;
    const hls = hlsRef.current;
    if (!video) return;

    if (hls?.liveSyncPosition) {
      video.currentTime = hls.liveSyncPosition;
      setLiveLatency(0);
    } else if (video.duration && isFinite(video.duration)) {
      video.currentTime = Math.max(0, video.duration - 8);
      setLiveLatency(0);
    }
    safePlay();
  };

  // Safe play engine with automatic muted fallback if browser blocks unmuted autoplay
  const safePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    isUserPausedRef.current = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn("[VideoPlayer] Autoplay con audio bloqueado por el navegador. Intentando inicio silenciado...", err);
          // Fallback 1: Autoplay silenciado (los navegadores siempre lo permiten sin interacción)
          video.muted = true;
          setIsMuted(true);
          setMutedByPolicy(true);
          video
            .play()
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch(() => {
              // Fallback 2: Esperar clic del usuario sin dejar el spinner congelado
              setIsPlaying(false);
              setIsLoading(false);
            });
        });
    }
  };

  // Active Anti-Freeze Watchdog (Guardián de Continuidad en Vivo)
  useEffect(() => {
    const watchdogInterval = setInterval(() => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video || isUserPausedRef.current) return;

      // When the stream is supposed to be playing:
      if (!video.paused) {
        if (video.currentTime === lastTimeRef.current && video.readyState >= 2) {
          frozenTicksRef.current += 1;

          if (frozenTicksRef.current === 2) {
            // Level 1: Nudge forward past PTS gap / ad transition hole
            console.info("[Anti-Freeze Watchdog] Nudgeando 250ms hacia adelante para saltar bache PTS...");
            video.currentTime += 0.25;
            safePlay();
          } else if (frozenTicksRef.current === 3) {
            // Level 2: Jump to live edge
            console.info("[Anti-Freeze Watchdog] Saltando al punto en vivo (live edge)...");
            if (hls?.liveSyncPosition) {
              video.currentTime = hls.liveSyncPosition;
            } else {
              video.currentTime += 1.0;
            }
            hls?.startLoad();
            safePlay();
          } else if (frozenTicksRef.current >= 5) {
            // Level 3: Soft media recovery
            console.warn("[Anti-Freeze Watchdog] Ejecutando recuperación profunda de stream...");
            frozenTicksRef.current = 0;
            hls?.recoverMediaError();
            safePlay();
          }
        } else {
          frozenTicksRef.current = 0;
          lastTimeRef.current = video.currentTime;
        }

        // Real-time live delay tracking and auto-catchup
        if (hls?.liveSyncPosition && video.currentTime) {
          const delay = Math.max(0, Math.round(hls.liveSyncPosition - video.currentTime));
          setLiveLatency(delay);

          // Auto-snap to live edge if delay exceeds 16 seconds
          if (delay > 16 && !isUserPausedRef.current) {
            console.info(`[Anti-Freeze Watchdog] Auto-sincronizando al vivo (retraso acumulado: ${delay}s)...`);
            video.currentTime = hls.liveSyncPosition;
            setLiveLatency(0);
          }
        }
      } else if (!isUserPausedRef.current && video.readyState >= 2) {
        // Video paused unexpectedly (e.g. browser ad pause or packet drop)
        safePlay();
      }
    }, 2000);

    return () => clearInterval(watchdogInterval);
  }, []);

  // HTML5 Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => {
      // Debounce loading indicator: only show if buffering takes > 800ms
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused && videoRef.current.readyState < 3) {
          setIsLoading(true);
        }
      }, 800);
    };

    const handlePlaying = () => {
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      setIsLoading(false);
      setIsPlaying(true);
      setErrorMessage(null);
    };

    const handleCanPlay = () => {
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      setIsLoading(false);
    };

    const handleLoadedData = () => {
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      setIsLoading(false);
    };

    const handleStalled = () => {
      if (!isUserPausedRef.current && hlsRef.current) {
        hlsRef.current.startLoad();
      }
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("stalled", handleStalled);

    return () => {
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("stalled", handleStalled);
    };
  }, []);

  // Initialize or reload HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorMessage(null);
    setIsLoading(true);
    isUserPausedRef.current = false;
    frozenTicksRef.current = 0;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 15,
        maxBufferLength: 8, // Mantener buffer corto para no acumular latencia
        maxMaxBufferLength: 16,
        maxBufferSize: 30 * 1000 * 1000,
        liveSyncDurationCount: 2, // Reducido de 3 a 2 fragmentos (recorta ~10-15s de latencia)
        liveSyncDuration: 6, // Objetivo de 6s del borde en vivo
        liveMaxLatencyDuration: 14, // Si se aleja más de 14s, acelera o salta
        maxLiveSyncPlaybackRate: 1.2, // Aceleración suave 1.2x para alcanzar el vivo
        liveDurationInfinity: true,
        startFragPrefetch: true,
        highBufferWatchdogPeriod: 2,
        maxBufferHole: 3, // Auto-skip PTS holes up to 3s (commercials)
        nudgeOffset: 0.2,
        nudgeMaxRetry: 10,
        maxFragLookUpTolerance: 0.25,
        manifestLoadingTimeOut: 12000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 800,
        levelLoadingTimeOut: 12000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 5,
        fragLoadingRetryDelay: 800,
      });

      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      // Auto-jump to live edge when manifest/level is loaded
      hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
        if (data.details.live) {
          const liveEdge = hls.liveSyncPosition;
          if (liveEdge && Math.abs(liveEdge - video.currentTime) > 22 && !isUserPausedRef.current) {
            console.info(`[VideoPlayer] Auto-snapping a live edge al cargar nivel (retraso: ${Math.round(liveEdge - video.currentTime)}s)`);
            video.currentTime = liveEdge;
            setLiveLatency(0);
          }
        }
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.FRAG_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setIsLoading(false);
        safePlay();

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
        console.warn("[Hls Event]", data.type, data.details, "fatal:", data.fatal);

        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          if (video && !video.paused && !isUserPausedRef.current) {
            video.currentTime += 0.2;
            safePlay();
          }
        }

        if (
          data.details === Hls.ErrorDetails.BUFFER_NUDGE_ON_STALL ||
          data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE
        ) {
          if (video && !video.paused && !isUserPausedRef.current) {
            safePlay();
          }
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("[Hls Error] Error de red fatal. Reiniciando carga...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("[Hls Error] Error de decodificación. Recuperando buffer...");
              hls.recoverMediaError();
              break;
            default:
              console.error("[Hls Error] Error crítico. Reconectando stream...");
              setRetryCount((prev) => prev + 1);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari / iOS fallback
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        safePlay();
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
      isUserPausedRef.current = false;
      safePlay();
    } else {
      isUserPausedRef.current = true;
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (!video.muted) {
      setMutedByPolicy(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const video = videoRef.current;
    if (video) {
      video.volume = val;
      video.muted = val === 0;
      setIsMuted(val === 0);
      if (val > 0) {
        setMutedByPolicy(false);
      }
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

  const handleContainerClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (mutedByPolicy) {
      video.muted = false;
      setIsMuted(false);
      setMutedByPolicy(false);
    }

    if (video.paused) {
      safePlay();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08] group cursor-pointer"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain bg-black"
        playsInline
      />

      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto">
        <div className="flex items-center space-x-3">
          {/* Interactive Live Sync Badge */}
          {liveLatency <= 20 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncToLive();
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/25 hover:bg-[#10b981]/40 border border-[#4edea3]/50 text-xs font-mono font-bold text-[#4edea3] transition cursor-pointer"
              title="Sincronizado con la señal en directo. Clic para forzar sincronización"
            >
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
              <span>EN VIVO {liveLatency > 0 ? `(-${liveLatency}s)` : ""}</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                syncToLive();
              }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f59e0b]/30 hover:bg-[#f59e0b]/50 border border-[#f59e0b]/60 text-xs font-mono font-bold text-[#fbbf24] animate-pulse transition shadow-lg cursor-pointer"
              title="Retrasado respecto a la señal en directo. Clic para saltar al tiempo real"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RETRASADO (-{liveLatency}s) • IR AL VIVO</span>
            </button>
          )}

          <span className="font-headline font-bold text-base text-white drop-shadow truncate max-w-sm sm:max-w-md">
            {channel.name}
          </span>
          <span className="text-xs text-[#86948a] font-mono hidden sm:inline">({channel.category})</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white hover:text-[#ef4444] transition"
          title="Cerrar reproductor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Browser Muted Autoplay Warning Banner */}
      {mutedByPolicy && isPlaying && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            const video = videoRef.current;
            if (video) {
              video.muted = false;
              setIsMuted(false);
              setMutedByPolicy(false);
            }
          }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-[#10b981]/25 hover:bg-[#10b981]/40 border border-[#4edea3]/60 backdrop-blur-xl text-white text-xs font-mono font-bold flex items-center space-x-2 shadow-2xl transition animate-bounce cursor-pointer"
        >
          <VolumeX className="w-4 h-4 text-[#4edea3]" />
          <span>Audio silenciado por el navegador. Haz clic para activar sonido</span>
        </div>
      )}

      {/* Big Center Play Trigger (When video is paused and not buffering) */}
      {!isPlaying && !isLoading && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            safePlay();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs z-15 transition"
        >
          <div className="w-20 h-20 rounded-full bg-[#10b981]/25 hover:bg-[#10b981]/40 border-2 border-[#4edea3] flex items-center justify-center text-[#4edea3] shadow-2xl hover:scale-105 transition-all">
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
          <span className="mt-3 px-4 py-1.5 rounded-full bg-black/70 border border-white/10 text-white text-xs font-mono font-semibold tracking-wider">
            Clic para reproducir señal
          </span>
        </div>
      )}

      {/* Loading Spinner with pointer-events-none so it NEVER blocks user clicks */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#4edea3] rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-mono text-[#4edea3]">Sintonizando señal de fútbol...</p>
        </div>
      )}

      {/* Error / Reconnect Banner */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md z-30 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-[#f59e0b] mb-2" />
          <p className="text-sm font-semibold text-white mb-1">{errorMessage}</p>
          <p className="text-xs text-[#86948a] font-mono mb-4">
            Reintentando conectar automáticamente al servidor IPTV...
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleManualRetry();
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] rounded-xl text-xs font-mono font-bold transition shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Forzar Reconexión</span>
          </button>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
      >
        <div className="flex items-center justify-between text-white">
          {/* Left Controls: Play/Pause, Volume */}
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#4edea3] transition"
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

            {/* Quick Live Sync button in bottom bar */}
            <button
              onClick={syncToLive}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                liveLatency <= 20
                  ? "bg-[#10b981]/20 text-[#4edea3] hover:bg-[#10b981]/35 border border-[#10b981]/40"
                  : "bg-[#f59e0b]/30 text-[#fbbf24] hover:bg-[#f59e0b]/50 border border-[#f59e0b]/60 animate-pulse"
              }`}
              title="Sincronizar al punto en vivo"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${liveLatency <= 20 ? "bg-[#4edea3] animate-pulse" : "bg-[#fbbf24]"}`}></span>
              <span>LIVE {liveLatency > 0 ? `(-${liveLatency}s)` : ""}</span>
            </button>
          </div>

          {/* Right Controls: Quality, Audio, Fullscreen */}
          <div className="flex items-center space-x-3">
            {/* Audio Track Menu */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  title="Pistas de Audio"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 text-xs font-mono"
                >
                  <AudioLines className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Audio</span>
                </button>
                {showAudioMenu && (
                  <div className="absolute bottom-10 right-0 bg-[#090d16] border border-white/10 rounded-xl shadow-2xl p-1 min-w-[140px] z-30 font-mono text-xs backdrop-blur-xl">
                    {audioTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => selectAudioTrack(track.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition ${
                          currentAudioTrack === track.id
                            ? "bg-[#10b981]/20 text-[#4edea3] font-bold"
                            : "hover:bg-white/5 text-[#dfe2ef]"
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
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 text-xs font-mono"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>
                  {currentQuality === -1
                    ? "Auto"
                    : qualityLevels.find((q) => q.id === currentQuality)?.label || "Calidad"}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-10 right-0 bg-[#090d16] border border-white/10 rounded-xl shadow-2xl p-1 min-w-[120px] z-30 font-mono text-xs backdrop-blur-xl">
                  <button
                    onClick={() => selectQuality(-1)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition ${
                      currentQuality === -1
                        ? "bg-[#10b981]/20 text-[#4edea3] font-bold"
                        : "hover:bg-white/5 text-[#dfe2ef]"
                    }`}
                  >
                    Auto (Adaptativo)
                  </button>
                  {qualityLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => selectQuality(lvl.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition ${
                        currentQuality === lvl.id
                          ? "bg-[#10b981]/20 text-[#4edea3] font-bold"
                          : "hover:bg-white/5 text-[#dfe2ef]"
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
              className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-[#4edea3] transition"
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
