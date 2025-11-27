// app/welcome/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // timings (ms)
  const AUDIO_PLAY_MS = 2800;
  const LEAVES_DURATION_MS = 1400;
  const LEAVES_SHOW_DELAY = 120;

  const [leavesActive, setLeavesActive] = useState(false);
  const [leavesMounted, setLeavesMounted] = useState(false);

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeOutAudio = useCallback((duration = 600) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const startVol = Math.max(0, Math.min(1, audio.volume || 0.36));
      const steps = Math.max(4, Math.ceil(duration / 50));
      let step = 0;
      clearFadeInterval();

      fadeIntervalRef.current = window.setInterval(() => {
        step++;
        const fraction = step / steps;
        const newVol = Math.max(0, startVol * (1 - fraction));
        audio.volume = Number(newVol.toFixed(3));
        if (step >= steps) {
          clearFadeInterval();
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = startVol;
            audio.loop = false;
          } catch {}
        }
      }, Math.round(duration / steps));
    } catch {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      clearFadeInterval();
    }
  }, []);

  // robust navigation helper: try client push, fallback to full navigation if push doesn't land
  const ensureNavigate = (path: string) => {
    // attempt client navigation (no .catch because router.push may return void)
    try {
      router.push(path);
    } catch {
      // ignore any router.push runtime errors
    }

    // check after a short delay; force full navigation if not landed
    setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const current = window.location.pathname + window.location.search;
          if (!current.startsWith(path)) {
            window.location.assign(path);
          }
        }
      } catch {
        // ignore
      }
    }, 420);
  };

  const handleGetStarted = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.32;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      // autoplay might be blocked — ignore
    }

    // show leaves briefly
    setLeavesMounted(true);
    window.setTimeout(() => setLeavesActive(true), LEAVES_SHOW_DELAY);
    window.setTimeout(() => {
      setLeavesActive(false);
      window.setTimeout(() => setLeavesMounted(false), 400);
    }, LEAVES_DURATION_MS + 300);

    // fade audio, then navigate
    window.setTimeout(() => {
      try {
        if (audioRef.current) fadeOutAudio(550);
      } catch {}
      window.setTimeout(() => ensureNavigate("/chat"), 450);
    }, AUDIO_PLAY_MS);
  };

  const onFeatureClick = (id: string) => {
    if (id === "plans") ensureNavigate("/chat?focus=plans");
    else ensureNavigate("/chat");
  };
