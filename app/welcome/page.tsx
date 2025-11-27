// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // timings (ms)
  const AUDIO_PLAY_MS = 3000; // play 3 seconds
  const LEAVES_DURATION_MS = 1500;
  const LEAVES_SHOW_DELAY = 120;

  const [leavesActive, setLeavesActive] = useState(false);
  const [leavesMounted, setLeavesMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

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
            audio.volume = startVol; // restore nominal volume for next play
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

  const startNavigation = () => {
    // small page transition for premium feel
    setTransitioning(true);
    // wait for fade to finish (matches CSS .page-fade transition)
    setTimeout(() => router.push("/chat"), 550);
  };

  const handleGetStarted = async () => {
    // play audio on gesture
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      // ignore
    }

    // mount + activate leaves after tiny delay
    setLeavesMounted(true);
    window.setTimeout(() => setLeavesActive(true), LEAVES_SHOW_DELAY);

    // hide/unmount leaves after their run
    window.setTimeout(() => {
      setLeavesActive(false);
      window.setTimeout(() => setLeavesMounted(false), 420);
    }, LEAVES_DURATION_MS + 300);

    // after snippet length, fade audio and navigate with nice page fade
    window.setTimeout(() => {
      try {
        if (audioRef.current) fadeOutAudio(650);
      } catch {}
      // slightly delay navigation so fade out can be heard
      setTimeout(() => startNavigation(), 420);
    }, AUDIO_PLAY_MS);
  };

  // empty spans — leaf visuals are CSS ::before/::after (no emoji glyphs)
  const leaves = Array.from({ length: 14 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }} aria-hidden />
  ));

  // premium SVG icons for feature tiles
  const IconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 21l-4.35-4.35" stroke="#065f46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="11" cy="11" r="5" stroke="#065f46" strokeWidth="2.2" />
    </svg>
  );
  const IconCog = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="#065f46" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.4 15a1.8 1.8 0 0 0 .3 1.9l.1.1a.8.8 0 0 1-.1 1.1l-.9.9a.8.8 0 0 1-1.1.1l-.1-.1a1.8 1.8 0 0 0-1.9-.3 1.8 1.8 0 0 0-1 .9l-.2.5a.8.8 0 0 1-.9.5h-1.2a.8.8 0 0 1-.9-.5l-.2-.5a1.8 1.8 0 0 0-1-.9 1.8 1.8 0 0 0-1.9.3l-.1.1a.8.8 0 0 1-1.1-.1l-.9-.9a.8.8 0 0 1-.1-1.1l.1-.1a1.8 1.8 0 0 0 .3-1.9 1.8 1.8 0 0 0-.9-1l-.5-.2a.8.8 0 0 1-.5-.9V12c0-.38.23-.73.5-.9l.5-.2a1.8 1.8 0 0 0 .9-1 1.8 1.8 0 0 0-.3-1.9L4.4 6.6a.8.8 0 0 1 .1-1.1l.9-.9c.3-.3.8-.3 1.1-.1l.1.1a1.8 1.8 0 0 0 1.9.3h.1a1.8 1.8 0 0 0 1-.9l.2-.5c.1-.3.4-.5.7-.5h1.2c.3 0 .6.2.7.5l.2.5c.3.5.7.8 1 .9.6.2 1.3 0 1.9-.3l.1-.1c.3-.3.8-.3 1.1.1l.9.9c.3.3.3.8.1 1.1l-.1.1a1.8 1.8 0 0 0-.3 1.9v.1c.2.3.4.8.9 1l.5.2c.3.1.5.4.5.8v1.2c0 .3-.2.6-.5.8l-.5.2a1.8 1.8 0 0 0-.9 1z" stroke="#065f46" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <main className={`min-h-screen w-full flex items-center justify-center p-8 relative overflow-hidden ${transitioning ? "page-fade" : ""}`}>
      {/* subtle page backdrop gradient + vignette for depth */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-30">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F1FFF7] via-[#ECFFF3] to-white opacity-95" />
        <div className="absolute inset-0 -z-20" style={{ background:
          "radial-gradient(40% 35% at 10% 10%, rgba(37,99,59,0.03), transparent 8%), radial-gradient(30% 25% at 90% 85%, rgba(6,95,70,0.02), transparent 8%)"
        }} />
        <div className="absolute inset-0 -z-10" style={{
          background: "linear-gradient(120deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))",
          mixBlendMode: "overlay",
        }} />
      </div>

      {/* central card (glass + rim + soft shadow) */}
      <div
        className="relative z-10 w-full max-w-4xl mx-auto rounded-3xl py-12 px-10 md:px-16 shadow-2xl"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(245,255,247,0.85))",
          backdropFilter: "saturate(150%) blur(8px)",
          border: "1px solid rgba(14,50,36,0.06)",
          boxShadow: "0 30px 80px rgba(9,30,21,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* subtle rim glow */}
        <div aria-hidden style={{
          position: "absolute",
          inset: "-2px",
          borderRadius: 20,
          boxShadow: "0 0 120px rgba(34,197,94,0.06) inset",
          zIndex: -1
        }} />

        <div className="flex flex-col items-center text-center gap-6">
          {/* premium logo badge */}
          <div className="relative" >
            <div className="logo-badge">
              <div className="badge-inner">
                <img src="/logo.png" alt="Greanly logo" width={84} height={84} />
              </div>
            </div>
          </div>

          {/* beefy headline */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-[-0.02em] leading-tight" style={{ textShadow: "0 2px 0 rgba(255,255,255,0.6)" }}>
            Greanly
          </h1>

          <p className="max-w-2xl text-slate-700 text-lg md:text-xl leading-relaxed">
            Make your business greener — practical, measurable steps that save money and reduce waste.
          </p>

          {/* three premium tiles */}
          <div className="mt-6 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="feature-badge"><IconCheck/></div>
              <div className="feature-text">Cut costs & waste with practical steps</div>
            </div>

            <div className="feature-card">
              <div className="feature-badge"><IconSearch/></div>
              <div className="feature-text">Find sustainable suppliers & materials</div>
            </div>

            <div className="feature-card">
              <div className="feature-badge"><IconCog/></div>
              <div className="feature-text">Simple action plans (30/60/90 days)</div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <button
              onClick={handleGetStarted}
              className="cta inline-flex items-center gap-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-8 py-3 rounded-full shadow-xl transform transition active:scale-95"
              aria-label="Get Started with Greanly"
            >
              <span className="chev" aria-hidden>➜</span>
              <span>Get Started</span>
              <span className="pulse" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* footer text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">Built with care • AI + practical sustainability tips</div>

      {/* audio */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves overlay (mounted only when needed) */}
      {leavesMounted && (
        <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
          {leaves}
        </div>
      )}

      {/* styles */}
      <style jsx>{`
        /* page fade (on navigation start) */
        .page-fade {
          animation: pageFade 520ms ease forwards;
        }
        @keyframes pageFade {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px) scale(0.998); }
        }

        /* logo badge */
        .logo-badge {
          width: 116px;
          height: 116px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          box-shadow: 0 10px 30px rgba(16,185,129,0.06), 0 2px 6px rgba(6,95,70,0.04);
          position: relative;
        }
        .logo-badge::after {
          content: "";
          position: absolute;
          inset: -26px;
          border-radius: 999px;
          filter: blur(36px);
          opacity: 0.9;
          background: radial-gradient(circle at 50% 40%, rgba(34,197,94,0.12), transparent 30%);
        }
        .badge-inner {
          width: 88px;
          height: 88px;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, white, rgba(245,255,247,0.9));
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }

        /* feature cards */
        .feature-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(245,255,246,0.85));
          border: 1px solid rgba(8,30,18,0.04);
          box-shadow: 0 10px 30px rgba(8,20,15,0.03);
          transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms;
        }
        .feature-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 24px 60px rgba(8,20,15,0.06);
        }
        .feature-badge {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, rgba(237,253,245,0.9), rgba(222,253,238,0.9));
          box-shadow: 0 6px 18px rgba(34,197,94,0.06), inset 0 1px 0 rgba(255,255,255,0.6);
          border: 1px solid rgba(34,197,94,0.06);
        }
        .feature-text {
          color: #064e3b;
          font-size: 0.95rem;
          text-align: center;
          max-width: 12rem;
          line-height: 1.28;
        }

        /* CTA */
        .cta {
          position: relative;
          background: linear-gradient(180deg, #059669, #047857);
          padding-left: 28px;
          padding-right: 28px;
        }
        .cta .chev {
          display: inline-grid;
          place-items: center;
          width: 36px;
          height: 36px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          transform: translateX(-6px);
          transition: transform 260ms cubic-bezier(.2,.9,.2,1);
          box-shadow: 0 6px 18px rgba(6,95,70,0.12);
        }
        .cta:hover .chev { transform: translateX(0); }
        .cta .pulse{
          position: absolute;
          right: -8px;
          top: -8px;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          background: radial-gradient(circle at 40% 40%, rgba(16,185,129,0.14), transparent 45%);
          opacity: 0.9;
          filter: blur(6px);
          pointer-events: none;
        }

        /* leaves overlay */
        .leaves-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 60;
          overflow: hidden;
          display: block;
          opacity: 0;
          transition: opacity 260ms ease;
        }
        .leaves-overlay.active {
          opacity: 1;
        }

        /* each leaf is a CSS shape (no emoji); customizable via --i */
        .leaves-overlay .leaf {
          --size: 22px;
          position: absolute;
          top: -12%;
          left: calc(var(--i) * 6.8%);
          width: var(--size);
          height: calc(var(--size) * 0.66);
          transform-origin: center;
          opacity: 0;
          animation: leafFall ${LEAVES_DURATION_MS}ms cubic-bezier(.14,.9,.36,1) forwards;
          animation-delay: calc(var(--i) * 46ms);
        }
        .leaves-overlay .leaf::before {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 42% 58% 42% 58% / 60% 40% 60% 40%;
          transform: rotate(-20deg);
          background: linear-gradient(160deg, rgba(34,139,34,0.98), rgba(94,212,134,0.9));
          box-shadow: 0 6px 12px rgba(8,20,12,0.06);
        }
        .leaves-overlay .leaf::after {
          content: "";
          position: absolute;
          left: 46%;
          top: 18%;
          width: 1px;
          height: 60%;
          background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(0,0,0,0.06));
          transform: rotate(-16deg);
          opacity: 0.9;
        }
        .leaves-overlay .leaf:nth-child(3n) { --size: 26px; }
        .leaves-overlay .leaf:nth-child(4n) { --size: 18px; }

        @keyframes leafFall {
          0% {
            opacity: 0;
            transform: translateY(-8vh) translateX(0) rotate(-6deg) scale(0.86);
            filter: drop-shadow(0 2px 6px rgba(8,20,12,0.02));
          }
          12% {
            opacity: 0.9;
            transform: translateY(6vh) translateX(2.2vw) rotate(6deg) scale(1.06);
          }
          60% {
            opacity: 1;
            transform: translateY(60vh) translateX(8vw) rotate(180deg) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) translateX(22vw) rotate(420deg) scale(0.94);
            filter: drop-shadow(0 10px 18px rgba(8,20,12,0.06));
          }
        }

        /* small responsive adjustments */
        @media (max-width: 880px) {
          .feature-text { max-width: 11rem; font-size: 0.95rem; }
          .logo-badge { width: 100px; height: 100px; }
        }
        @media (max-width: 640px) {
          main { padding: 18px; }
          .feature-card { padding: 14px; border-radius: 12px; }
          .feature-text { max-width: 10rem; font-size: 0.92rem; }
        }
      `}</style>
    </main>
  );
}
