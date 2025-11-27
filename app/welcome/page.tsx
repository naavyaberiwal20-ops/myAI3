// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [leavesActive, setLeavesActive] = useState(false);
  const LEAVES_DURATION_MS = 1200; // how long the leaf animation runs before navigating

  const handleGetStarted = async () => {
    // Try to play audio (plays on user interaction so browsers will allow it)
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        // play might return a promise; ignore errors gracefully
        await audioRef.current.play();
      }
    } catch (e) {
      // ignore play error (some browsers block unless gesture)
      // navigation will still proceed after animation
      // console.warn("audio play failed:", e);
    }

    // start leaves animation
    setLeavesActive(true);

    // wait a short duration for the animation then navigate
    setTimeout(() => {
      router.push("/chat");
    }, LEAVES_DURATION_MS);
  };

  // small helper to render many leaf elements (purely decorative)
  const leaves = Array.from({ length: 14 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }} aria-hidden />
  ));

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* decorative blurred circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-55 blur-2xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl py-10 px-8 md:px-16 shadow-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,255,245,0.70))",
          backdropFilter: "saturate(140%) blur(8px)",
          border: "1px solid rgba(24,32,20,0.06)",
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative animate-logo-lift">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full -z-10 shimmer-ring"
              style={{ width: 168, height: 168 }}
            />
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/90 shadow-md">
              <img src="/logo.png" alt="Greanly logo" width={92} height={92} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight animate-fade-up">Greanly</h1>
          <p className="max-w-2xl text-neutral-700 text-base md:text-lg animate-fade-up delay-100">
            Your sustainability companion — smarter, simpler, actionable.
          </p>

          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl animate-fade-up delay-200">
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Reduce waste with practical steps</span>
            </li>
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Find sustainable suppliers</span>
            </li>
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Improve materials, packaging & sourcing</span>
            </li>
          </ul>

          <div className="mt-6 animate-fade-up delay-300">
            <button
              onClick={handleGetStarted}
              className="get-started inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95"
            >
              <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">Built with care • AI + practical sustainability tips</div>

      {/* ambient audio (play triggered by Get Started click) */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* falling leaves overlay (appears when leavesActive=true) */}
      <div
        className={`leaves-overlay ${leavesActive ? "active" : ""}`}
        aria-hidden
      >
        {leaves}
      </div>

      <style jsx>{`
        .get-started {
          /* base styling kept by tailwind classes above; add hover illumination */
        }
        .get-started:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 18px 40px rgba(16, 185, 129, 0.18), 0 6px 18px rgba(16, 185, 129, 0.06);
        }

        /* Logo + fade animations */
        .animate-logo-lift { animation: lift 900ms cubic-bezier(0.2,0.9,0.2,1) both; }
        .animate-fade-up { opacity: 0; transform: translateY(12px); animation: fadeUp 700ms cubic-bezier(0.2,0.9,0.2,1) forwards; }
        .animate-fade-up.delay-100 { animation-delay: 120ms; }
        .animate-fade-up.delay-200 { animation-delay: 240ms; }
        .animate-fade-up.delay-300 { animation-delay: 360ms; }

        .shimmer-ring {
          background: radial-gradient(circle at 30% 30%, rgba(165,255,205,0.95) 0%, rgba(165,255,205,0.6) 18%, rgba(255,255,255,0.02) 60%);
          filter: blur(28px);
          opacity: 0.95;
          animation: shimmerScale 3200ms ease-in-out infinite;
        }

        @keyframes shimmerScale {
          0% { transform: scale(0.96) rotate(0deg); opacity: 0.75; }
          50% { transform: scale(1.03) rotate(7deg); opacity: 1; }
          100% { transform: scale(0.96) rotate(0deg); opacity: 0.75; }
        }

        @keyframes lift { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        /* --------------------------
           Leaves overlay / transition
           --------------------------*/
        .leaves-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 60;
          overflow: hidden;
          display: none;
        }
        .leaves-overlay.active {
          display: block;
        }

        .leaves-overlay .leaf {
          position: absolute;
          top: -8%;
          left: calc(var(--i) * 7%);
          font-size: 20px;
          opacity: 0;
          transform: translateY(-10vh) rotate(0deg);
          animation: leafFall 1100ms linear forwards;
          animation-delay: calc(var(--i) * 45ms);
          filter: drop-shadow(0 6px 8px rgba(8, 20, 12, 0.08));
        }

        /* slightly vary size and spin by index */
        .leaves-overlay .leaf:nth-child(3n) { font-size: 22px; transform-origin: center; }
        .leaves-overlay .leaf:nth-child(4n) { font-size: 18px; }
        .leaves-overlay .leaf:nth-child(5n) { font-size: 24px; }

        @keyframes leafFall {
          0% {
            opacity: 0;
            transform: translateY(-10vh) translateX(0) rotate(-10deg) scale(1);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0.96;
            transform: translateY(110vh) translateX(20vw) rotate(360deg) scale(0.95);
          }
        }

        /* small responsive tweaks */
        @media (max-width: 640px) {
          .leaves-overlay .leaf { font-size: 14px; left: calc(var(--i) * 6%); }
        }
      `}</style>
    </main>
  );
}
