// 🌟 Eltron Luxury Video Startup Engine v3.0 (Interactive Power On & Exclusive Chime)
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Power } from "lucide-react";

interface EltronBootSplashProps {
  onComplete?: () => void;
}

// 🎵 Synthesize an exclusive cinematic luxury startup chime (Apple/Tesla flagship style)
function playExclusivePowerSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    masterGain.connect(ctx.destination);

    // 1. Deep Sub-Bass Ignition Thump (Flagship power feeling)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.45);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.45);

    // 2. Futuristic Resonant Swell (Warm analog power-on sweep)
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = "triangle";
    sweepOsc.frequency.setValueAtTime(220, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
    sweepGain.gain.setValueAtTime(0.01, now);
    sweepGain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(masterGain);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.5);

    // 3. Shimmering Golden Chime (E-Major Pentatonic Chord: E5, G#5, B5, E6, G#6)
    const chordFreqs = [659.25, 830.61, 987.77, 1318.51, 1661.22];
    chordFreqs.forEach((freq, idx) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = "sine";
      const startOffset = now + 0.08 + idx * 0.035;

      chimeOsc.frequency.setValueAtTime(freq * 0.85, startOffset);
      chimeOsc.frequency.exponentialRampToValueAtTime(freq, startOffset + 0.12);

      chimeGain.gain.setValueAtTime(0.001, startOffset);
      chimeGain.gain.linearRampToValueAtTime(0.16 / (idx * 0.4 + 1), startOffset + 0.06);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, startOffset + 1.1);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);
      chimeOsc.start(startOffset);
      chimeOsc.stop(startOffset + 1.15);
    });
  } catch {
    // silent fallback if browser audio context restricted
  }
}

export default function EltronBootSplash({ onComplete }: EltronBootSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string>("/videos/eltron-boot-mobile.mp4");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isFinishedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const forceBoot = urlParams.get("boot") === "true" || urlParams.get("splash") === "1";
      const alreadyShown = sessionStorage.getItem("eltron_boot_shown");

      if (!forceBoot && alreadyShown === "1") {
        // Immediately remove curtain and hide splash on subsequent visits
        const curtain = document.getElementById("boot-curtain");
        if (curtain) curtain.style.display = "none";
        setIsVisible(false);
        return;
      }

      sessionStorage.setItem("eltron_boot_shown", "1");
    } catch {
      // ignore
    }

    // Select correct video based on viewport aspect ratio and device:
    // Landscape desktop/laptop (width >= 768 and width > height) -> desktop horizontal video (16:9)
    // Portrait phone/Telegram Web App or narrow viewport -> mobile vertical video (9:16)
    const isLandscape =
      window.innerWidth >= 768 &&
      window.innerWidth > window.innerHeight &&
      !/Android|iPhone|iPod/i.test(navigator.userAgent);

    const activeSrc = isLandscape ? "/videos/eltron-boot-desktop.mp4" : "/videos/eltron-boot-mobile.mp4";
    setVideoSrc(activeSrc);

    // Preload video silently in background
    const video = videoRef.current;
    if (video) {
      video.src = activeSrc;
      video.muted = false;
      video.preload = "auto";
      video.load();
    }

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  // 🚀 Start video with exclusive sound on Power button tap
  const startVideoPlayback = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    if (hasStarted || isActivating) return;

    // 1. Play the exclusive luxury startup sound immediately
    playExclusivePowerSound();

    // 2. Trigger glowing activation burst animation
    setIsActivating(true);

    // 3. Seamlessly transition to full-screen video with full sound
    setTimeout(() => {
      setHasStarted(true);
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.muted = isMuted; // false by default -> 100% sound ON!

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsMuted(false);
            })
            .catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });
        }
      }

      // Safety fallback timer: max 11.5 seconds from start
      fallbackTimerRef.current = setTimeout(() => {
        finishSplash();
      }, 11500);
    }, 280);
  };

  const finishSplash = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }

    // Smoothly dissolve both curtain and video with blur effect
    const curtain = document.getElementById("boot-curtain");
    if (curtain) {
      curtain.style.transition = "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s ease-out";
      curtain.style.opacity = "0";
      curtain.style.filter = "blur(20px)";
      setTimeout(() => {
        curtain.style.display = "none";
      }, 850);
    }

    setIsFadingOut(true);

    setTimeout(() => {
      setIsVisible(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
      onComplete?.();
    }, 800);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const current = video.currentTime;
    const total = video.duration || 10;
    const pct = Math.min(100, (current / total) * 100);
    setProgress(pct);

    // Trigger smooth blur-dissolve at the last 0.65 seconds of the video
    if (total > 0 && current >= total - 0.65 && !isFadingOut) {
      finishSplash();
    }
  };

  const handleVideoEnded = () => {
    finishSplash();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
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
      onClick={!hasStarted ? startVideoPlayback : undefined}
      className={`fixed inset-0 z-[99999999] flex flex-col items-center justify-between select-none overflow-hidden bg-black transition-all duration-800 ease-out ${
        isFadingOut
          ? "opacity-0 blur-xl scale-105 brightness-110 pointer-events-none"
          : "opacity-100 blur-0 scale-100 brightness-100"
      }`}
      style={{
        background: "#000000",
      }}
    >
      {/* 🎬 FULLSCREEN BORDERLESS VIDEO BACKDROP (100% Edge-to-edge, Zero black borders) */}
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-10 bg-black transition-opacity duration-700 ${
          hasStarted ? "opacity-100" : "opacity-0"
        }`}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover select-none pointer-events-none"
          style={{
            backgroundColor: "#000000",
          }}
        />
      </div>

      {/* TOP HEADER CONTROLS (Floating Overlay) */}
      <div
        className="relative w-full max-w-5xl px-6 pt-6 flex items-center justify-between z-30 pointer-events-auto"
        style={{
          paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        }}
      >
        {/* Sound Toggle (Shown once video starts playing) */}
        {hasStarted ? (
          <button
            onClick={toggleMute}
            aria-label="Toggle sound"
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 animate-in fade-in duration-500 ${
              isMuted
                ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300"
                : "bg-black/50 hover:bg-black/70 border-white/20 text-[#fcedb6] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#fcedb6] group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[11px] font-medium tracking-wider uppercase">
              {isMuted ? "Ovozsiz 🔇" : "Ovozli 🔊"}
            </span>
          </button>
        ) : (
          <div />
        )}

        {/* Skip Button (Available from the start) */}
        <button
          onClick={handleSkip}
          className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white transition-all duration-200"
        >
          <span className="text-[11px] font-medium tracking-wider uppercase">O'tkazish</span>
          <span className="text-xs text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all">
            &rarr;
          </span>
        </button>
      </div>

      {/* ⏻ INITIAL BLACK SCREEN POWER BUTTON (Displayed before start) */}
      {!hasStarted && (
        <div className="relative z-30 flex-1 w-full flex flex-col items-center justify-center px-6">
          {/* Subtle Ambient Golden Glow Behind Orb */}
          <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none animate-pulse" />

          {/* Interactive Power Button Container */}
          <button
            onClick={startVideoPlayback}
            aria-label="Power On Eltron"
            className={`relative group flex flex-col items-center justify-center p-6 rounded-full cursor-pointer transition-all duration-500 ${
              isActivating
                ? "scale-125 opacity-0 duration-300"
                : "scale-100 opacity-100 hover:scale-105 active:scale-95"
            }`}
          >
            {/* Concentric Pulsing Ripples */}
            <div className="absolute inset-0 rounded-full border border-[#d4af37]/40 animate-ping duration-1000 pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-[#d4af37]/25 animate-pulse duration-700 pointer-events-none" />
            <div className="absolute -inset-7 rounded-full border border-[#d4af37]/10 animate-pulse duration-1000 pointer-events-none" />

            {/* Glassmorphic Luxury Power Orb */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#2a2210] via-[#141005] to-[#0a0802] border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.45)] group-hover:shadow-[0_0_65px_rgba(212,175,55,0.85)] flex items-center justify-center transition-all duration-300">
              <Power className="w-9 h-9 sm:w-11 sm:h-11 text-[#fcedb6] group-hover:text-white group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(252,237,182,0.95)]" />
            </div>
          </button>

          {/* Title & Call-to-action text */}
          <div
            className={`mt-6 text-center flex flex-col items-center gap-1.5 transition-all duration-300 pointer-events-none ${
              isActivating ? "opacity-0 scale-90" : "opacity-100"
            }`}
          >
            <span className="text-[11px] font-bold tracking-[0.35em] text-[#d4af37] uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]">
              ELTRON &bull; POWER ON
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-white/90 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              Ishga tushirish uchun bosing
            </h2>
            <p className="text-[10px] sm:text-[11px] text-white/40 tracking-wider mt-0.5">
              ✦ Rasmiy taqdimot &bull; Ovozli ✦
            </p>
          </div>
        </div>
      )}

      {/* BOTTOM PROGRESS & STATUS BAR (Shown once video starts playing) */}
      <div
        className={`relative w-full max-w-md px-8 pb-8 flex flex-col items-center z-30 pointer-events-auto transition-all duration-500 ${
          hasStarted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Dynamic Status Text */}
        <div className="flex items-center justify-between w-full mb-2.5 text-[11px] tracking-wider text-white/80 uppercase font-mono drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
            <span>
              {progress < 30
                ? "Tizim ishga tushmoqda..."
                : progress < 65
                ? "Do'kon ma'lumotlari ulanmoqda..."
                : progress < 90
                ? "Katalog tayyorlanmoqda..."
                : "Xush kelibsiz!"}
            </span>
          </span>
          <span className="text-[#fcedb6] font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Glowing Progress Bar Container */}
        <div className="relative w-full h-[3.5px] bg-white/20 rounded-full overflow-hidden backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {/* Glowing Neon Track */}
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
        <p className="mt-3.5 text-[9px] uppercase tracking-[0.25em] text-white/50 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          Toshkent &bull; Original Sifat &bull; Kafolat
        </p>
      </div>
    </div>
  );
}

