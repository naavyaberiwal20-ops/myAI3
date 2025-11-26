// app/page.tsx (or components/WelcomePage.tsx)
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-[#E9FCEC] via-[#F6FFF4] to-[#E8F7EA] flex items-center justify-center p-6">
      {/* subtle background decorative shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl transform rotate-12" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-60 blur-2xl transform -rotate-6" />
      </div>

      {/* content card */}
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
          {/* animated logo */}
          <div className="relative animate-logo-lift">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/80 shadow-md">
              <Image
                src="/logo.png"
                alt="Greanly logo"
                width={92}
                height={92}
                className="object-contain"
              />
            </div>
            <span className="absolute -bottom-2 right-6 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {/* heading */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight animate-fade-up">
            Greanly
          </h1>

          {/* subtitle */}
          <p className="max-w-2xl text-neutral-700 text-base md:text-lg animate-fade-up delay-100">
            Your sustainability companion — smarter, simpler, actionable.
          </p>

          {/* bullets */}
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

          {/* CTA */}
          <div className="mt-6 animate-fade-up delay-300">
            <button
              onClick={() => router.push("/chat")}
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* small footer / hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">
        Built with care • AI + practical sustainability tips
      </div>

      {/* local styles for subtle animations */}
      <style jsx>{`
        .animate-logo-lift {
          animation: lift 900ms cubic-bezier(.2,.9,.2,1) both;
        }
        .animate-fade-up {
          opacity: 0;
          transform: translateY(12px);
          animation: fadeUp 700ms cubic-bezier(.2,.9,.2,1) forwards;
        }
        .animate-fade-up.delay-100 { animation-delay: 120ms; }
        .animate-fade-up.delay-200 { animation-delay: 240ms; }
        .animate-fade-up.delay-300 { animation-delay: 360ms; }

        @keyframes lift {
          from { transform: translateY(14px) scale(.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* subtle responsive tweaks */
        @media (max-width: 640px) {
          .max-w-3xl { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>
    </main>
  );
}
