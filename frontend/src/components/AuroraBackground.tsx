"use client";

import React, { useRef, useEffect } from "react";

export default function AuroraBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure autoplay begins smoothly and runs at a relaxed majestic speed
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
      });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Moving Northern Lights Aurora Video with increased vivid opacity */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover opacity-45 sm:opacity-55 filter saturate-175 contrast-115"
      >
        <source src="/videos/aurora.webm" type="video/webm" />
      </video>

      {/* Atmospheric vignette & obsidian dark mode gradient blend */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070b14]/40 via-transparent to-[#070b14]/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,#070b14_90%)]" />
    </div>
  );
}
