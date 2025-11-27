// app/welcome/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
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

  const leaves = Array.from({ length: 12 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }} aria-hidden />
  ));

  return (
    <main className="welcome-hero min-h-screen w-full flex flex-col items-center justify-start p-4 relative overflow-hidden">
      {/* Top: theme toggle (keeps your existing component) */}
      <header className="absolute top-4 left-0 right-0 z-60 flex items-center justify-end px-6">
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-40">
        <div className="bg-circle left" />
        <div className="bg-circle right" />
        <div className="pattern-dots" />
        <div className="floating-orb" />
      </div>

      {/* Left & right decorative SVGs */}
      <svg className="decor-left" width="560" height="760" viewBox="0 0 560 760" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M0 420 C60 300 140 250 220 180 C300 110 360 70 430 40 C500 10 560 0 560 0 L560 760 L0 760 Z" fill="#DFF6E6" opacity="0.95" />
        </g>
      </svg>

      <svg className="decor-right" width="640" height="780" viewBox="0 0 640 780" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M640 40 C520 120 480 200 420 260 C360 320 300 380 240 460 C180 540 120 620 60 700 L0 780 L640 780 Z" fill="#E9FBF3" opacity="0.95" />
        </g>
      </svg>

      {/* Main card blob + content */}
      <div className="welcome-card-wrapper z-30 mt-20 w-full flex justify-center">
        <svg className="card-blob" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
          <defs>
            <filter id="softShadow2" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="36" stdDeviation="64" floodColor="rgba(13,59,42,0.08)" />
            </filter>
          </defs>
          <path d="M120 40 C260 -30 520 -20 720 40 C860 84 960 170 920 310 C880 450 720 560 540 560 C360 560 170 540 110 430 C50 320 68 170 120 40 Z"
            fill="#FFFFFF" filter="url(#softShadow2)"/>
        </svg>

        <div className="welcome-card-content" role="region" aria-label="Welcome card content">
          <header className="welcome-top w-full">
            <div className="logo-top-left" aria-hidden>
              <div className="logo-badge">
                <Image src="/logo.png" width={64} height={64} alt="Greanly" className="rounded-full" />
              </div>
            </div>

            <div className="brand-header" style={{ width: "100%", textAlign: "center" }}>
              <h1 className="welcome-title">Greanly</h1>
              <p className="welcome-sub">
                Make your business greener — practical, measurable steps that save money and reduce waste.
              </p>
            </div>
          </header>

          <section className="features-grid" aria-hidden>
            <div className="feature" onClick={() => onFeatureClick("cuts")}>
              <div className="feature-icon" aria-hidden>✓</div>
              <div className="feature-title">Cut costs & waste</div>
              <div className="feature-sub">Practical steps you can use now</div>
            </div>

            <div className="feature" onClick={() => onFeatureClick("suppliers")}>
              <div className="feature-icon" aria-hidden>🔍</div>
              <div className="feature-title">Find better suppliers</div>
              <div className="feature-sub">Sustainable materials & vendors</div>
            </div>

            <div className="feature" onClick={() => onFeatureClick("plans")}>
              <div className="feature-icon" aria-hidden>⚙</div>
              <div className="feature-title">Action plans (30/60/90)</div>
              <div className="feature-sub">Simple prioritized next steps</div>
            </div>
          </section>

          {/* CTA: visually above blob — unified appearance in all modes */}
          <div className="cta-row" aria-hidden={false}>
            <button onClick={handleGetStarted} className="get-started cta-btn" aria-label="Get Started with Greanly">
              <svg className="cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="cta-label">Get Started</span>
            </button>
          </div>

          <footer className="welcome-foot">
            <small>Built with care • AI + practical sustainability tips</small>
          </footer>
        </div>
      </div>

      {/* audio */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves overlay */}
      {leavesMounted && (
        <div className={leaves-overlay ${leavesActive ? "active" : ""}} aria-hidden>
          {leaves}
        </div>
      )}

      {/* styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

        /* central tokens for colors, including CTA */
        :root {
          --accent-1: #0D3B2A;
          --accent-2: #14503B;
          --card-text-light: #10201A;

          /* CTA tokens — dark green background + light green text/arrow */
          --btn-bg: linear-gradient(180deg, #062b1f 0%, #0b3928 100%);
          --btn-text: #DFF6E8; /* light green label & arrow */
          --btn-glow: rgba(26, 184, 96, 0.16);
        }

        .welcome-hero {
          background: linear-gradient(180deg, rgba(237,250,240,1) 0%, rgba(245,252,248,1) 100%);
          min-height: 100vh;
        }

        .bg-circle.left { position:absolute; left:-240px; top:-160px; width:880px; height:880px; background: linear-gradient(135deg, rgba(223,246,230,1), rgba(201,240,209,0.96)); filter: blur(90px); opacity:0.6; z-index:-45; }
        .bg-circle.right { position:absolute; right:-180px; bottom:-220px; width:720px; height:720px; background: linear-gradient(135deg, rgba(240,255,246,1), rgba(217,247,228,0.96)); filter: blur(72px); opacity:0.52; z-index:-45; }
        .pattern-dots { position:absolute; inset:0; background-image: radial-gradient(circle at 10% 20%, rgba(13,59,42,0.02) 1px, transparent 1px); background-size: 26px 26px; opacity:0.25; pointer-events:none; z-index:-44; }
        .floating-orb { position:absolute; left:10%; bottom:4%; width:200px; height:200px; border-radius:9999px; background: radial-gradient(circle at center, rgba(174,240,199,0.18), rgba(174,240,199,0.06)); filter: blur(36px); z-index:-43; pointer-events:none; }

        .decor-left, .decor-right { position:absolute; z-index:8; pointer-events:none; opacity:0.98; filter: drop-shadow(0 20px 40px rgba(13,59,42,0.04)); }
        .decor-left { left:-6%; top:6%; width:36vw; max-width:560px; transform: translateX(-6%); }
        .decor-right { right:-4%; bottom:-2%; width:42vw; max-width:640px; transform: translateX(6%); }

        .welcome-card-wrapper { display:flex; justify-content:center; width:100%; pointer-events:auto; }
        .card-blob { position:absolute; width:110%; left:-5%; top:8px; z-index:6; filter: drop-shadow(0 40px 92px rgba(13,59,42,0.08)); pointer-events:none; }

        .welcome-card-content {
          position:relative; z-index:40;
          width: min(1100px, 92%);
          margin: 36px 0;
          padding: 56px 64px 72px;
          display:flex;
          flex-direction:column;
          gap:18px;
          align-items:center;
          text-align:center;
          pointer-events:auto;
          min-height:420px;
          color: var(--card-text-light);
        }

        .logo-top-left { position:absolute; left:44px; top:-28px; z-index:42; width:78px; height:78px; border-radius:999px; background: linear-gradient(180deg, rgba(237,250,240,1), rgba(217,239,224,0.94)); box-shadow: 0 18px 44px rgba(13,59,42,0.06); display:flex; align-items:center; justify-content:center; padding:6px; }

        .welcome-title {
          font-family: 'Playfair Display', serif;
          font-weight:900;
          font-size:48px;
          margin:0;
          color: var(--accent-1);
          letter-spacing:-0.6px;
          line-height:1;
        }

        .welcome-sub { margin-top:10px; color: inherit; max-width:880px; font-size:16px; line-height:1.6; }

        .features-grid { margin-top:8px; width:100%; display:grid; grid-template-columns: repeat(3, 1fr); gap:18px; align-items:stretch; }
        .feature { background: linear-gradient(180deg, rgba(245,252,248,0.95), rgba(237,250,240,0.92)); border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:8px; align-items:center; border:1px solid rgba(13,59,42,0.035); box-shadow:0 10px 36px rgba(13,59,42,0.03); transition: transform 180ms ease, box-shadow 180ms ease; color: inherit; }
        .feature:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(13,59,42,0.06); }
        .feature-icon { width:56px; height:56px; border-radius:999px; display:grid; place-items:center; font-size:18px; color:var(--accent-1); background: linear-gradient(180deg, rgba(236,247,232,0.94), rgba(217,237,224,0.9)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.55); }
        .feature-title { font-weight:800; color: var(--accent-2); }
        .feature-sub { font-size:13px; color: rgba(16,32,26,0.56); }

        .cta-row { margin-top:18px; display:flex; justify-content:center; width:100%; }
        .cta-btn {
          display:inline-flex;
          align-items:center;
          gap:12px;
          padding:14px 36px;
          border-radius:999px;
          background: var(--btn-bg);
          color: var(--btn-text);
          font-weight:800;
          box-shadow:
            0 18px 40px rgba(4,10,6,0.45),
            0 8px 34px rgba(3,18,12,0.16),
            0 0 40px var(--btn-glow);
          border:none;
          cursor:pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms;
          position: relative;
          z-index:60; /* crucial: keeps CTA above blob and other layers */
          opacity:1;
          -webkit-tap-highlight-color: transparent;
        }
        .cta-btn:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow:
            0 30px 60px rgba(4,10,6,0.5),
            0 12px 56px rgba(3,18,12,0.18),
            0 0 64px rgba(26,184,96,0.22);
        }

        /* arrow and label inherit the CTA text color */
        .cta-arrow { color: var(--btn-text); flex: 0 0 auto; display: inline-block; }
        .cta-label { color: var(--btn-text); font-weight:800; font-size:16px; }

        .welcome-foot { margin-top:20px; color: rgba(16,32,26,0.5); font-size:13px; }

        .leaves-overlay { pointer-events:none; position: fixed; inset: 0; z-index:70; overflow:hidden; display:block; opacity:0; transition: opacity 260ms ease; }
        .leaves-overlay.active { opacity:1; }
        .leaves-overlay .leaf { --size:22px; position:absolute; top:-12%; left: calc(var(--i) * 7%); width:var(--size); height: calc(var(--size) * 0.7); transform-origin:center; opacity:0; animation: leafFall ${LEAVES_DURATION_MS}ms cubic-bezier(.12,.78,.32,1) forwards; animation-delay: calc(var(--i) * 45ms); }
        .leaves-overlay .leaf::before { content:""; display:block; width:100%; height:100%; border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%; transform: rotate(-18deg); background: linear-gradient(160deg, rgba(34,139,34,0.95), rgba(106,201,117,0.92)); box-shadow: 0 6px 10px rgba(8,20,12,0.06); }
        .leaves-overlay .leaf::after { content:""; position:absolute; left:44%; top:18%; width:1px; height:60%; background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.06)); transform: rotate(-16deg); border-radius:1px; opacity:0.9; }
        .leaves-overlay .leaf:nth-child(3n) { --size:26px; }
        .leaves-overlay .leaf:nth-child(4n) { --size:18px; }
        @keyframes leafFall {
          0% { opacity:0; transform: translateY(-8vh) translateX(0) rotate(-6deg) scale(0.86); filter: drop-shadow(0 2px 6px rgba(8,20,12,0.02)); }
          12% { opacity:0.9; transform: translateY(6vh) translateX(2vw) rotate(6deg) scale(1.06); }
          60% { opacity:1; transform: translateY(60vh) translateX(8vw) rotate(180deg) scale(0.98); }
          100% { opacity:0; transform: translateY(110vh) translateX(18vw) rotate(380deg) scale(0.94); filter: drop-shadow(0 10px 18px rgba(8,20,12,0.06)); }
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .decor-left, .decor-right { display:none; }
          .welcome-card-content { padding: 34px 22px 46px; min-height: auto; }
          .features-grid { grid-template-columns: 1fr; gap:14px; }
          .logo-top-left { left:22px; top:-8px; }
          .cta-btn { padding:12px 20px; width:100%; justify-content:center; }
        }

        @media (max-width: 640px) {
          .welcome-title { font-size:28px; }
        }

        /* keep dark background when theme is dark */
        :global(.dark) .welcome-hero {
          background: linear-gradient(180deg, rgba(6,20,18,0.95), rgba(4,14,12,0.98));
        }

        /* === NEW: force ALL text INSIDE the white blob to emerald green (#145a32)
           This affects title, subtitle, feature titles/subs, CTA label/arrow, footer, etc.
           It intentionally does not change box backgrounds, icon-circle backgrounds, or CTA background. */
        .welcome-card-content * {
          color: #145a32 !important;
          fill: #145a32 !important;
          stroke: #145a32 !important;
        }

        /* keep feature cards and icon circles visually identical to light mode (background, shadows) */
        .feature {
          background: linear-gradient(180deg, rgba(245,252,248,0.95), rgba(237,250,240,0.92));
          border-radius:14px;
          padding:18px;
          display:flex;
          flex-direction:column;
          gap:8px;
          align-items:center;
          border:1px solid rgba(13,59,42,0.035);
          box-shadow:0 10px 36px rgba(13,59,42,0.03);
          transition: transform 180ms ease, box-shadow 180ms ease;
          color: inherit;
        }

        .feature-icon {
          width:56px;
          height:56px;
          border-radius:999px;
          display:grid;
          place-items:center;
          font-size:18px;
          color:var(--accent-1);
          background: linear-gradient(180deg, rgba(236,247,232,0.94), rgba(217,237,224,0.9));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
        }

        /* keep CTA visuals as before (background + glow) */
        .cta-btn {
          background: var(--btn-bg);
          box-shadow:
            0 18px 40px rgba(4,10,6,0.45),
            0 8px 34px rgba(3,18,12,0.16),
            0 0 40px var(--btn-glow);
          z-index: 999;
        }

        /* ensure SVG strokes/fills that use currentColor follow the emerald override */
        .welcome-card-content svg {
          color: inherit !important;
          stroke: currentColor !important;
          fill: currentColor !important;
        }
      `}</style>
    </main>
  );
}
