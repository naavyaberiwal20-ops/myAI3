// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  const TARGET_VOLUME = 0.36;
  const FADE_DURATION_MS = 1500;
  const FADE_STEP_MS = 60;

  const fadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const steps = Math.round(FADE_DURATION_MS / FADE_STEP_MS);
    const stepAmount = TARGET_VOLUME / steps;

    fadeIntervalRef.current = window.setInterval(() => {
      if (!audio) return;

      audio.volume = Math.min(TARGET_VOLUME, audio.volume + stepAmount);

      if (audio.volume >= TARGET_VOLUME - 0.01) {
        clearInterval(fadeIntervalRef.current!);
        audio.volume = TARGET_VOLUME;
      }
    }, FADE_STEP_MS);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0;
    audio.muted = true;
    audio.setAttribute("playsinline", "");

    const startAudio = async () => {
      try {
        // Start muted autoplay (always allowed)
        await audio.play();

        // Begin fade-in
        fadeIn();

        // After fade, unmute (works silently)
        setTimeout(() => {
          audio.muted = false;
        }, FADE_DURATION_MS + 150);
      } catch (err) {
        console.error("Autoplay blocked:", err);
      }
    };

    startAudio();

    return () => {
      try {
        audio.pause();
      } catch {}
    };
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      {/* ----- UI CONTENT STAYS SAME ----- */}
      <div>
        <h1 className="text-4xl font-bold">Greanly</h1>
        <p className="text-gray-700">
          Your sustainability companion — smarter, simpler, actionable.
        </p>

        <button
          onClick={() => router.push("/chat")}
          className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-full"
        >
          Get Started
        </button>
      </div>

      {/* ---- The audio element (autoplays) ---- */}
      <audio src="/ambient-forest.mp3" ref={audioRef} preload="auto" autoPlay loop />
    </main>
  );
}
