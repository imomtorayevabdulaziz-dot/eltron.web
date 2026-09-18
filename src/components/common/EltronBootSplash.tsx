"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";

interface EltronBootSplashProps {
  onComplete?: () => void;
}

export default function EltronBootSplash({ onComplete }: EltronBootSplashProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [phase, setPhase] = useState<"intro" | "chime" | "voice" | "done">("intro");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const DURATION_MS = 5200; // 5.2 seconds for full cinematic experience

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forceBoot = urlParams.get("boot") === "true" || urlParams.get("splash") === "1";
      const alreadyShown = sessionStorage.getItem("eltron_boot_shown");

      if (!forceBoot && alreadyShown === "1") {
        return; // Already played during this browsing session
      }

      // Mark as shown for the session so internal links do not replay
      sessionStorage.setItem("eltron_boot_shown", "1");
      setIsVisible(true);
    } catch {
      setIsVisible(true);
    }

    // Audio setup
    const audio = new Audio("/audio/eltron-boot.mp3");
    audio.preload = "auto";
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // Autoplay policy prevented audio, wait for first user gesture
          setAutoplayBlocked(true);
        });
    }

    // Smooth 60fps progress & phase manager
    const updateTimeline = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const pct = Math.min(100, (elapsed / (DURATION_MS - 400)) * 100);
      setProgress(pct);

      if (elapsed < 1600) {
        setPhase("intro");
      } else if (elapsed < 2800) {
        setPhase("chime");
      } else if (elapsed < 4400) {
        setPhase("voice");
      } else {
        setPhase("done");
      }

      if (elapsed >= DURATION_MS - 600 && !isFadingOut) {
        setIsFadingOut(true);
      }

      if (elapsed < DURATION_MS) {
        animationFrameRef.current = requestAnimationFrame(updateTimeline);
      } else {
        finishSplash();
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTimeline);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const finishSplash = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      onComplete?.();
    }, 600);
  };

  const handleUserGesture = () => {
    if (autoplayBlocked && audioRef.current) {
      audioRef.current.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      const nextMuted = !isMuted;
      audioRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && autoplayBlocked) {
        audioRef.current.play().then(() => setAutoplayBlocked(false)).catch(() => {});
      }
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    finishSplash();
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={handleUserGesture}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-between select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, #0a0e0c 0%, #030504 70%, #010202 100%)",
      }}
    >
      {/* Dynamic Golden Ambient Aura in background */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(212, 175, 55, 0.12) 0%, rgba(170, 128, 16, 0.04) 45%, transparent 75%)",
          opacity: phase === "intro" ? 0.4 : phase === "chime" ? 0.95 : 0.8,
        }}
      />

      {/* Atmospheric Star / Dust Shimmer Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#f5d77f] rounded-full blur-[0.5px] animate-ping duration-1000" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#f5d77f] rounded-full blur-[1px] animate-pulse duration-700" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#d4af37] rounded-full blur-[0.5px] animate-pulse duration-1000" />
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-[#f5d77f] rounded-full blur-[1px] animate-ping duration-1200" />
      </div>

      {/* TOP HEADER CONTROLS */}
      <div className="w-full max-w-5xl px-6 pt-6 flex items-center justify-between z-10">
        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label="Toggle sound"
          className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
            autoplayBlocked
              ? "bg-gradient-to-r from-[#d4af37]/20 to-[#aa8010]/20 border-[#d4af37]/50 text-[#f5d77f] animate-pulse"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#f5d77f] group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[11px] font-medium tracking-wider uppercase">
            {autoplayBlocked ? "Ovozni yoqish" : isMuted ? "Ovozsiz" : "Ovozli"}
          </span>
        </button>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 backdrop-blur-xl border border-white/10 text-white/60 hover:text-white transition-all duration-200"
        >
          <span className="text-[11px] font-medium tracking-wider uppercase">O'tkazish</span>
          <span className="text-xs text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all">
            &rarr;
          </span>
        </button>
      </div>

      {/* CENTER LOGO & LUXURY ANIMATION HERO */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 px-4">
        {/* Expanding Sound Radar / Pulse Waves (Samsung / Apple flagships) */}
        <div className="absolute flex items-center justify-center pointer-events-none">
          <div
            className={`absolute rounded-full border border-[#d4af37]/30 transition-all duration-1000 ${
              phase !== "intro"
                ? "w-64 h-64 md:w-80 md:h-80 opacity-40 scale-110"
                : "w-24 h-24 opacity-0 scale-75"
            }`}
          />
          <div
            className={`absolute rounded-full border border-[#f5d77f]/20 transition-all duration-1000 delay-150 ${
              phase !== "intro"
                ? "w-80 h-80 md:w-96 md:h-96 opacity-25 scale-125"
                : "w-28 h-28 opacity-0 scale-75"
            }`}
          />
          <div
            className={`absolute rounded-full border border-[#d4af37]/10 transition-all duration-1000 delay-300 ${
              phase === "voice" || phase === "done"
                ? "w-96 h-96 md:w-[460px] md:h-[460px] opacity-20 scale-140"
                : "w-32 h-32 opacity-0 scale-75"
            }`}
          />
        </div>

        {/* Halo Glow behind Logo */}
        <div
          className="absolute w-44 h-44 md:w-56 md:h-56 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
          style={{
            background:
              phase === "chime" || phase === "voice"
                ? "radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(170, 128, 16, 0.15) 50%, transparent 80%)"
                : "radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)",
            transform: phase === "chime" ? "scale(1.3)" : "scale(1.0)",
          }}
        />

        {/* LOGO CONTAINER */}
        <div className="relative flex flex-col items-center">
          {/* Glowing Emblem */}
          <div className="relative mb-5 transform transition-all duration-1000 ease-out">
            <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
              {/* Outer Golden Glow Ring */}
              <div
                className="absolute inset-0 rounded-3xl transition-opacity duration-700"
                style={{
                  boxShadow:
                    phase === "chime" || phase === "voice"
                      ? "0 0 45px rgba(212, 175, 55, 0.65), inset 0 0 25px rgba(245, 215, 127, 0.35)"
                      : "0 0 25px rgba(212, 175, 55, 0.25)",
                }}
              />

              <img
                src="/logo-icon.png?v=eltron_gold"
                alt="Eltron"
                className="w-20 h-20 md:w-24 md:h-24 object-contain select-none drop-shadow-[0_4px_24px_rgba(212,175,55,0.45)] transition-transform duration-700"
                style={{
                  transform: phase === "chime" ? "scale(1.08)" : phase === "voice" ? "scale(1.04)" : "scale(1.0)",
                }}
              />

              {/* Shimmer Light Sweep Overlay */}
              <div
                className={`absolute inset-0 overflow-hidden rounded-3xl pointer-events-none transition-opacity duration-500 ${
                  phase === "chime" || phase === "voice" ? "opacity-100" : "opacity-0"
                }`}
              >
                <div
                  className="w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer"
                  style={{
                    animationDuration: "2.2s",
                    animationIterationCount: "infinite",
                  }}
                />
              </div>
            </div>
          </div>

          {/* BRAND NAME WITH METALLIC GOLD GRADIENT */}
          <div className="flex items-center gap-2">
            <span
              className="text-3xl md:text-4xl font-black tracking-[0.28em] text-transparent bg-clip-text transition-all duration-700"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #fcedb6 0%, #e5c158 25%, #d4af37 50%, #aa8010 75%, #fcedb6 100%)",
                textShadow: "0 0 28px rgba(212, 175, 55, 0.35)",
                letterSpacing: "0.32em",
              }}
            >
              ELTRON
            </span>
          </div>

          {/* Slogan with soft fade-in */}
          <div
            className="flex items-center gap-2 mt-2 transition-all duration-1000"
            style={{
              opacity: phase === "voice" || phase === "done" ? 1 : 0.6,
              transform: phase === "voice" || phase === "done" ? "translateY(0)" : "translateY(4px)",
            }}
          >
            <Sparkles className="w-3 h-3 text-[#d4af37] animate-pulse" />
            <p className="text-[10px] md:text-[11px] uppercase font-semibold tracking-[0.35em] text-[#d4af37]/80">
              Premium Aksessuarlar
            </p>
            <Sparkles className="w-3 h-3 text-[#d4af37] animate-pulse" />
          </div>
        </div>
      </div>

      {/* BOTTOM PROGRESS & STATUS BAR */}
      <div className="w-full max-w-sm px-8 pb-10 flex flex-col items-center z-10">
        {/* Subtle Status Text */}
        <div className="flex items-center justify-between w-full mb-2.5 text-[11px] tracking-wider text-white/40 uppercase font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            <span>
              {phase === "intro"
                ? "Tizim yuklanmoqda..."
                : phase === "chime"
                ? "Ma'lumotlar ulanmoqda..."
                : phase === "voice"
                ? "Do'kon tayyorlanmoqda..."
                : "Xush kelibsiz!"}
            </span>
          </span>
          <span className="text-[#d4af37]/80 font-bold">{Math.round(progress)}%</span>
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full h-[3px] bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Glowing Track */}
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #aa8010 0%, #d4af37 50%, #fcedb6 100%)",
              boxShadow: "0 0 12px rgba(212, 175, 55, 0.8)",
            }}
          />
        </div>

        {/* Device Brand Sub-caption */}
        <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/25 text-center">
          Toshkent &bull; Original Sifat &bull; Kafolat
        </p>
      </div>
    </div>
  );
}
