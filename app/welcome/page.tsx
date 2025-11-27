// app/welcome/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Premium Welcome / Hero — drop-in replacement for your existing page.tsx
 *
 * Keeps:
 * - ThemeToggle import & render
 * - audioRef + fade out behaviour
 * - leaves overlay with brief animation
 * - ensureNavigate fallback navigation
 *
 * Upgrades:
 * - modern hero layout with SVG background blob + radial highlights
 * - glass feature cards with hover lift
 * - large, elegant type (Playfair for headline)
 * - 3D CTA with deep shadow & subtle shine
 * - prefers-reduced-motion support
 */

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // timings
  const AUDIO_PLAY_MS = 2800;
  const LEAVES_DURATION_MS = 1400;
  const LEAVES_SHOW_DELAY = 120;

  const [leavesActive, setLeavesActive] = useState(false);
  const [leavesMounted, setLeavesMounted] = useState(false);

  // Basic fade out (safe)
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

  // robust navigation helper
  const ensureNavigate = (path: string) => {
    try {
      router.push(path);
    } catch {
      // ignore
    }
    setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const current = window.location.pathname + window.location.search;
          if (!current.startsWith(path)) {
            window.location.assign(path);
          }
        }
      } catch {}
    }, 420);
  };

  // click handler for CTA
  const handleGetStarted = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.32;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      // autoplay blocked — ok
    }

    // leaves show
    setLeavesMounted(true);
    window.setTimeout(() => setLeavesActive(true), LEAVES_SHOW_DELAY);
    window.setTimeout(() => {
      setLeavesActive(false);
      window.setTimeout(() => setLeavesMounted(false), 400);
    }, LEAVES_DURATION_MS + 300);

    // fade audio then navigate
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

  const leaves = Array.from({ length: 12 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }} aria-hidden />
  ));

  // Respect prefers-reduced-motion by disabling the animated entrance if user prefers it
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    try {
      mq.addEventListener?.('change', onChange);
    } catch {
      // older browsers
      mq.addListener?.(onChange);
    }
    return () => {
      try {
        mq.removeEventListener?.('change', onChange);
      } catch {
        mq.removeListener?.(onChange);
      }
    };
  }, []);

  return (
    <main className="min-h-screen w-full relative bg-gradient-to-b from-emerald-50 via-white to-white dark:from-[#02120f] dark:via-[#03181a]">
      {/* Top right theme toggle */}
      <header className="absolute top-6 right-6 z-50">
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero SVG background shapes */}
      <div className="absolute inset-0 -z-20 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1600 800" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="heroG1" x1="0" x2="1">
              <stop offset="0%" stopColor="#E8FBF0" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <radialGradient id="heroRad" cx="0.9" cy="0.12" r="0.6">
              <stop offset="0%" stopColor="#E6F9EF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E6F9EF" stopOpacity="0.04" />
            </radialGradient>
            <filter id="softBlur"><feGaussianBlur stdDeviation="40" /></filter>
          </defs>

          <path d="M0 160 C160 -40 420 -40 740 40 C980 96 1260 40 1600 180 L1600 800 L0 800 Z" fill="url(#heroG1)" filter="url(#softBlur)" opacity="0.95" />
          <circle cx="1460" cy="80" r="420" fill="url(#heroRad)" opacity="0.6" />
        </svg>
      </div>

      {/* Center content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20 md:py-28">
        <div className="flex gap-10 items-start">
          {/* Floating logo badge */}
          <div className="flex-shrink-0 mt-2">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/90 dark:bg-black/30 backdrop-blur-md flex items-center justify-center
                          shadow-[0_30px_80px_rgba(4,20,12,0.08),inset_0_2px_8px_rgba(255,255,255,0.6)]
                          transform transition-transform duration-700"
              style={{ willChange: "transform", animation: reducedMotion ? 'none' : 'float 6s ease-in-out infinite' } as any}
              aria-hidden
            >
              <Image src="/logo.png" alt="Greanly logo" width={80} height={80} className="object-contain" />
            </div>
          </div>

          {/* Text and features */}
          <div className="flex-1">
            <h1 className="font-[PlayfairDisplay], serif text-4xl sm:text-6xl md:text-6xl font-extrabold text-emerald-900 dark:text-emerald-200 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Greanly
            </h1>

            <p className="mt-4 max-w-3xl text-lg sm:text-xl text-emerald-700 dark:text-emerald-200/90">
              Make your business greener — practical, measurable steps that save money and reduce waste.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { id: 'cuts', title: 'Cut costs & waste', sub: 'Practical steps you can use now', icon: '✓' },
                { id: 'suppliers', title: 'Find better suppliers', sub: 'Sustainable materials & vendors', icon: '🔍' },
                { id: 'plans', title: 'Action plans (30/60/90)', sub: 'Simple prioritized next steps', icon: '⚙️' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onFeatureClick(f.id)}
                  className="group relative rounded-xl p-6 bg-white/90 dark:bg-[#04201a]/60 border border-white/60 dark:border-black/20
                             shadow-[0_18px_50px_rgba(10,30,20,0.06)] hover:shadow-[0_30px_80px_rgba(8,40,30,0.09)]
                             transform transition-all duration-300 ease-out hover:-translate-y-2 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-none w-12 h-12 rounded-full grid place-items-center text-lg bg-emerald-50 dark:bg-emerald-900/20 shadow-sm text-emerald-800">
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-800 dark:text-emerald-100">{f.title}</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-200/80 mt-1">{f.sub}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-4">
              <button
                onClick={handleGetStarted}
                className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
                           bg-gradient-to-b from-[#0b3f2a] to-[#08321f] text-emerald-100 shadow-[0_50px_90px_rgba(6,18,10,0.2)]
                           hover:translate-y-[-4px] transform transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/30"
                aria-label="Get Started"
                style={{ willChange: 'transform' }}
              >
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-emerald-50/30 text-emerald-100">
                  ➜
                </span>
                <span>Get Started</span>

                {/* glow under CTA */}
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-64 h-12 rounded-full blur-3xl" style={{ background: 'radial-gradient(closest-side, rgba(20,120,70,0.10), transparent)' }} />
              </button>

              <a href="#learn" className="text-sm text-emerald-700 dark:text-emerald-200/80 hover:underline">
                Learn how it works
              </a>
            </div>

            <div className="mt-8 text-sm text-emerald-700 dark:text-emerald-300/70">
              Built with care • AI + practical sustainability tips
            </div>
          </div>

          {/* Right spacer for balance on wide screens */}
          <div className="hidden lg:block lg:w-40" />
        </div>
      </div>

      {/* audio element */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves overlay */}
      {leavesMounted && (
        <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
          {leaves}
        </div>
      )}

      {/* Local styles for animations & legacy support */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

        /* floating logo keyframes (disabled if user prefers reduced motion) */
        @keyframes float {
          0% { transform: translateY(0) }
          50% { transform: translateY(-8px) }
          100% { transform: translateY(0) }
        }

        /* leaves animation timing derived from LEAVES_DURATION_MS var in JS */
        .leaves-overlay { pointer-events: none; position: fixed; inset: 0; z-index:60; overflow: hidden; opacity: 0; transition: opacity 260ms ease; }
        .leaves-overlay.active { opacity: 1; }

        .leaves-overlay .leaf {
          --size: 22px;
          position: absolute;
          top: -12%;
          left: calc(var(--i) * 7%);
          width: var(--size);
          height: calc(var(--size) * 0.68);
          transform-origin: center;
          opacity: 0;
          animation: leafFall ${LEAVES_DURATION_MS}ms cubic-bezier(.12,.78,.32,1) forwards;
          animation-delay: calc(var(--i) * 45ms);
        }
        .leaves-overlay .leaf::before {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
          transform: rotate(-18deg);
          background: linear-gradient(160deg, rgba(34,139,34,0.95), rgba(106,201,117,0.92));
          box-shadow: 0 6px 10px rgba(8,20,12,0.06);
        }
        .leaves-overlay .leaf::after {
          content: "";
          position: absolute;
          left: 44%;
          top: 18%;
          width: 1px;
          height: 60%;
          background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.06));
          transform: rotate(-16deg);
          border-radius: 1px;
          opacity: 0.9;
        }
        .leaves-overlay .leaf:nth-child(3n) { --size: 26px; }
        .leaves-overlay .leaf:nth-child(4n) { --size: 18px; }

        @keyframes leafFall {
          0% { opacity: 0; transform: translateY(-8vh) translateX(0) rotate(-6deg) scale(0.86); filter: drop-shadow(0 2px 6px rgba(8,20,12,0.02)); }
          12% { opacity: 0.9; transform: translateY(6vh) translateX(2vw) rotate(6deg) scale(1.06); }
          60% { opacity: 1; transform: translateY(60vh) translateX(8vw) rotate(180deg) scale(0.98); }
          100% { opacity: 0; transform: translateY(110vh) translateX(18vw) rotate(380deg) scale(0.94); filter: drop-shadow(0 10px 18px rgba(8,20,12,0.06)); }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .leaves-overlay .leaf { animation: none !important; opacity: 0 !important; }
          .w-28 { animation: none !important; transform: none !important; }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .w-28 { width: 84px; height: 84px; }
        }
        @media (max-width: 640px) {
          h1 { font-size: 30px !important; }
        }
      `}</style>
    </main>
  );
}
