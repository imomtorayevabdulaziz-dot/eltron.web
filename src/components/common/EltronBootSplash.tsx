// 🌟 Eltron Luxury Video Startup Engine v2.1
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface EltronBootSplashProps {
  onComplete?: () => void;
}

export default function EltronBootSplash({ onComplete }: EltronBootSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
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

    // Select correct video based on viewport aspect/width
    const isWide = window.innerWidth >= 768;
    const activeSrc = isWide ? "/videos/eltron-boot-desktop.mp4" : "/videos/eltron-boot-mobile.mp4";
    setVideoSrc(activeSrc);

    const video = videoRef.current;
    if (video) {
      video.src = activeSrc;
      video.load();

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch(() => {
            // If unmuted autoplay blocked by browser policy, play muted and prompt user
            video.muted = true;
            setIsMuted(true);
            setAutoplayBlocked(true);
            video.play().catch(() => {});
          });
      }
    }

    // Safety fallback: ensure splash always closes after max 11.5 seconds even if video fails
    fallbackTimerRef.current = setTimeout(() => {
      finishSplash();
    }, 11500);

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

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

    // Trigger smooth blur-dissolve at the last 0.6 seconds of the video
    if (total > 0 && current >= total - 0.65 && !isFadingOut) {
      finishSplash();
    }
  };

  const handleVideoEnded = () => {
    finishSplash();
  };

  const handleUserGesture = () => {
    // Unmute upon any tap or click if autoplay was restricted
    if (autoplayBlocked && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setAutoplayBlocked(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && autoplayBlocked) {
        setAutoplayBlocked(false);
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
      className={`fixed inset-0 z-[99999999] flex flex-col items-center justify-between select-none overflow-hidden bg-black transition-all duration-800 ease-out ${
        isFadingOut
          ? "opacity-0 blur-xl scale-105 brightness-110 pointer-events-none"
          : "opacity-100 blur-0 scale-100 brightness-100"
      }`}
      style={{
        background: "#000000",
      }}
    >
      {/* TOP HEADER CONTROLS */}
      <div className="w-full max-w-5xl px-6 pt-6 flex items-center justify-between z-30">
        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label="Toggle sound"
          className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
            autoplayBlocked
              ? "bg-gradient-to-r from-[#d4af37]/30 to-[#aa8010]/30 border-[#d4af37]/70 text-[#fcedb6] animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.5)]"
              : "bg-white/10 hover:bg-white/20 border-white/15 text-white/80 hover:text-white"
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#fcedb6] group-hover:scale-110 transition-transform" />
          )}
          <span className="text-[11px] font-medium tracking-wider uppercase">
            {autoplayBlocked ? "Ovozni yoqish 🔊" : isMuted ? "Ovozsiz" : "Ovozli"}
          </span>
        </button>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-xl border border-white/15 text-white/70 hover:text-white transition-all duration-200"
        >
          <span className="text-[11px] font-medium tracking-wider uppercase">O'tkazish</span>
          <span className="text-xs text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all">
            &rarr;
          </span>
        </button>
      </div>

      {/* CENTER VIDEO CONTAINER */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          autoPlay
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full object-contain md:max-w-5xl md:max-h-[82vh] pointer-events-none select-none"
          style={{
            backgroundColor: "#000000",
          }}
        />
      </div>

      {/* BOTTOM PROGRESS & STATUS BAR */}
      <div className="w-full max-w-md px-8 pb-8 flex flex-col items-center z-30">
        {/* Dynamic Status Text */}
        <div className="flex items-center justify-between w-full mb-2.5 text-[11px] tracking-wider text-white/60 uppercase font-mono">
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
          <span className="text-[#fcedb6] font-bold">{Math.round(progress)}%</span>
        </div>

        {/* Glowing Progress Bar Container */}
        <div className="relative w-full h-[3.5px] bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
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
        <p className="mt-3.5 text-[9px] uppercase tracking-[0.25em] text-white/35 text-center">
          Toshkent &bull; Original Sifat &bull; Kafolat
        </p>
      </div>
    </div>
  );
}
