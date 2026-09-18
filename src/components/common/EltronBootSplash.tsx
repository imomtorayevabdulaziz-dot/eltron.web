"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles, Zap } from "lucide-react";

interface EltronBootSplashProps {
  onComplete?: () => void;
}

export default function EltronBootSplash({ onComplete }: EltronBootSplashProps) {
  // Start visible so SSR/initial HTML is 100% black with zero flash of content
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [phase, setPhase] = useState<"intro" | "reveal" | "slash" | "voice" | "exit">("intro");
  const [isSwordSlashing, setIsSwordSlashing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isFinishedRef = useRef<boolean>(false);

  // Exactly 10.0 seconds total duration as explicitly requested
  const DURATION_MS = 10000;

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forceBoot = urlParams.get("boot") === "true" || urlParams.get("splash") === "1";
      const alreadyShown = sessionStorage.getItem("eltron_boot_shown");

      if (!forceBoot && alreadyShown === "1") {
        setIsVisible(false);
        return;
      }

      sessionStorage.setItem("eltron_boot_shown", "1");
    } catch {
      // fallback
    }

    // Audio setup (10-second high quality soundtrack)
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
          setAutoplayBlocked(true);
        });
    }

    // High precision 60fps animation timeline manager
    const updateTimeline = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const pct = Math.min(100, (elapsed / (DURATION_MS - 600)) * 100);
      setProgress(pct);

      // Phase 1: 0.0s - 2.0s (Deep atmospheric emergence)
      if (elapsed < 2000) {
        setPhase("intro");
      }
      // Phase 2: 2.0s - 4.8s (Logo & Name reveal, building tension)
      else if (elapsed < 4800) {
        setPhase("reveal");
        setIsSwordSlashing(false);
      }
      // Phase 3: 4.8s - 6.8s (QILICH NURI VA QILICH OVOZI - SHIIING!)
      else if (elapsed < 6800) {
        setPhase("slash");
        setIsSwordSlashing(true);
      }
      // Phase 4: 6.8s - 8.8s (MAYIN QIZBOLA OVOZI - "Eltron")
      else if (elapsed < 8800) {
        setPhase("voice");
      }
      // Phase 5: 8.8s - 10.0s (Smooth cinematic transition into storefront)
      else {
        setPhase("exit");
      }

      // Trigger fade out at 9.3s
      if (elapsed >= DURATION_MS - 700 && !isFadingOut) {
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
    }, 700);
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
      id="eltron-boot-splash"
      onClick={handleUserGesture}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-between select-none overflow-hidden bg-black transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, #070a08 0%, #020302 70%, #000000 100%)",
      }}
    >
      {/* 🚀 Synchronous inline script to prevent any FOUC on subsequent page visits */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var q=window.location.search||"";var f=q.indexOf("boot=true")!==-1||q.indexOf("splash=1")!==-1;if(!f&&sessionStorage.getItem("eltron_boot_shown")==="1"){var el=document.getElementById("eltron-boot-splash");if(el)el.style.display="none";}}catch(e){}})();`,
        }}
      />

      {/* Dynamic Golden Ambient Aura in background */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(212, 175, 55, 0.16) 0%, rgba(170, 128, 16, 0.05) 50%, transparent 80%)",
          opacity: phase === "intro" ? 0.3 : phase === "slash" ? 1.0 : phase === "voice" ? 0.85 : 0.6,
        }}
      />

      {/* Sparkle Particles in deep space */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-[#fcedb6] rounded-full blur-[0.5px] animate-ping duration-1000" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[#f5d77f] rounded-full blur-[1px] animate-pulse duration-700" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#d4af37] rounded-full blur-[0.5px] animate-pulse duration-1000" />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 bg-[#fcedb6] rounded-full blur-[1px] animate-ping duration-1200" />
      </div>

      {/* TOP HEADER CONTROLS */}
      <div className="w-full max-w-5xl px-6 pt-6 flex items-center justify-between z-20">
        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label="Toggle sound"
          className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
            autoplayBlocked
              ? "bg-gradient-to-r from-[#d4af37]/25 to-[#aa8010]/25 border-[#d4af37]/60 text-[#fcedb6] animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#fcedb6] group-hover:scale-110 transition-transform" />
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
          <span className="text-xs text-white/40 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all">
            &rarr;
          </span>
        </button>
      </div>

      {/* CENTER HERO: LOGO + BRAND NAME + QILICH NURI */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 px-4 w-full max-w-xl">
        {/* Expanding Sound Radar / Pulse Waves */}
        <div className="absolute flex items-center justify-center pointer-events-none">
          <div
            className={`absolute rounded-full border border-[#d4af37]/30 transition-all duration-1000 ${
              phase === "slash" || phase === "voice"
                ? "w-72 h-72 md:w-96 md:h-96 opacity-50 scale-110"
                : "w-24 h-24 opacity-0 scale-75"
            }`}
          />
          <div
            className={`absolute rounded-full border border-[#fcedb6]/20 transition-all duration-1000 delay-150 ${
              phase === "slash" || phase === "voice"
                ? "w-96 h-96 md:w-[450px] md:h-[450px] opacity-35 scale-125"
                : "w-28 h-28 opacity-0 scale-75"
            }`}
          />
          <div
            className={`absolute rounded-full border border-[#d4af37]/10 transition-all duration-1000 delay-300 ${
              phase === "voice" || phase === "exit"
                ? "w-[420px] h-[420px] md:w-[540px] md:h-[540px] opacity-25 scale-140"
                : "w-32 h-32 opacity-0 scale-75"
            }`}
          />
        </div>

        {/* Halo Glow behind Logo */}
        <div
          className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000"
          style={{
            background:
              phase === "slash"
                ? "radial-gradient(circle, rgba(255, 230, 150, 0.6) 0%, rgba(212, 175, 55, 0.3) 50%, transparent 80%)"
                : phase === "voice"
                ? "radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(170, 128, 16, 0.15) 50%, transparent 80%)"
                : "radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, transparent 70%)",
            transform: phase === "slash" ? "scale(1.4)" : "scale(1.0)",
          }}
        />

        {/* MAIN EMBLEM AND BRAND TYPOGRAPHY CONTAINER */}
        <div className="relative flex flex-col items-center overflow-hidden px-8 py-6 rounded-3xl">
          {/* 🗡️ SWORD LIGHT RAY (QILICH NURI) - Slices diagonally across both emblem and letters */}
          {isSwordSlashing && (
            <div
              className="absolute inset-0 pointer-events-none z-30 animate-sword-slash"
              style={{
                width: "250%",
                height: "250%",
                left: "-75%",
                top: "-75%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.1) 40%, rgba(255,255,255,0.95) 49%, #ffffff 50%, rgba(255,240,180,0.95) 51%, rgba(212,175,55,0.2) 60%, transparent 100%)",
                boxShadow: "0 0 50px rgba(255, 255, 255, 0.9), 0 0 100px rgba(212, 175, 55, 0.8)",
              }}
            />
          )}

          {/* Glowing Emblem */}
          <div className="relative mb-5 transform transition-all duration-1000 ease-out">
            <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
              {/* Outer Golden Glow Ring */}
              <div
                className={`absolute inset-0 rounded-3xl transition-all duration-700 ${
                  isSwordSlashing ? "animate-gold-flare" : ""
                }`}
                style={{
                  boxShadow:
                    phase === "slash"
                      ? "0 0 60px rgba(255, 230, 150, 0.8), inset 0 0 35px rgba(255, 255, 255, 0.6)"
                      : phase === "voice"
                      ? "0 0 45px rgba(212, 175, 55, 0.6), inset 0 0 25px rgba(245, 215, 127, 0.35)"
                      : "0 0 30px rgba(212, 175, 55, 0.3)",
                }}
              />

              <img
                src="/logo-icon.png?v=eltron_gold"
                alt="Eltron"
                className="w-24 h-24 md:w-28 md:h-28 object-contain select-none drop-shadow-[0_4px_28px_rgba(212,175,55,0.5)] transition-transform duration-700"
                style={{
                  transform:
                    phase === "slash"
                      ? "scale(1.12)"
                      : phase === "voice"
                      ? "scale(1.05)"
                      : "scale(1.0)",
                }}
              />
            </div>
          </div>

          {/* BRAND NAME WITH METALLIC GOLD 3D TYPOGRAPHY */}
          <div className="relative flex items-center justify-center mt-1">
            <span
              className="text-4xl md:text-5xl font-black tracking-[0.32em] text-transparent bg-clip-text transition-all duration-700"
              style={{
                backgroundImage:
                  isSwordSlashing
                    ? "linear-gradient(135deg, #ffffff 0%, #fff4c2 30%, #fcedb6 50%, #e5c158 75%, #ffffff 100%)"
                    : "linear-gradient(135deg, #fcedb6 0%, #e5c158 25%, #d4af37 50%, #aa8010 75%, #fcedb6 100%)",
                textShadow:
                  isSwordSlashing
                    ? "0 0 35px rgba(255, 255, 255, 0.8), 0 0 50px rgba(212, 175, 55, 0.7)"
                    : "0 0 24px rgba(212, 175, 55, 0.35)",
                letterSpacing: "0.32em",
              }}
            >
              ELTRON
            </span>
          </div>

          {/* Slogan */}
          <div
            className="flex items-center gap-2 mt-3 transition-all duration-1000"
            style={{
              opacity: phase === "voice" || phase === "slash" || phase === "exit" ? 1 : 0.6,
              transform:
                phase === "voice" || phase === "slash" || phase === "exit"
                  ? "translateY(0)"
                  : "translateY(4px)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#fcedb6] animate-pulse" />
            <p className="text-[11px] md:text-[12px] uppercase font-bold tracking-[0.35em] text-[#d4af37]">
              Premium Aksessuarlar
            </p>
            <Sparkles className="w-3.5 h-3.5 text-[#fcedb6] animate-pulse" />
          </div>
        </div>
      </div>

      {/* BOTTOM PROGRESS & STATUS BAR */}
      <div className="w-full max-w-sm px-8 pb-10 flex flex-col items-center z-20">
        {/* Dynamic Status Text */}
        <div className="flex items-center justify-between w-full mb-2.5 text-[11px] tracking-wider text-white/50 uppercase font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            <span>
              {phase === "intro"
                ? "Tizim ishga tushmoqda..."
                : phase === "reveal"
                ? "Ma'lumotlar ulanmoqda..."
                : phase === "slash"
                ? "Qilich nuri &bull; Tayyorlanmoqda..."
                : phase === "voice"
                ? "Do'konga xush kelibsiz!"
                : "Boshlanmoqda..."}
            </span>
          </span>
          <span className="text-[#fcedb6] font-bold">{Math.round(progress)}%</span>
        </div>

        {/* 10-Second Progress Bar Container */}
        <div className="relative w-full h-[3.5px] bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          {/* Glowing Track */}
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #aa8010 0%, #d4af37 50%, #ffffff 80%, #fcedb6 100%)",
              boxShadow: "0 0 14px rgba(212, 175, 55, 0.9)",
            }}
          />
        </div>

        {/* Device Brand Sub-caption */}
        <p className="mt-4 text-[9px] uppercase tracking-[0.25em] text-white/30 text-center">
          Toshkent &bull; Original Sifat &bull; Kafolat
        </p>
      </div>
    </div>
  );
}
