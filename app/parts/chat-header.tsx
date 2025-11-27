import React from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Left block for header content
 * Keeps the same API but adds nicer spacing when used with the recommended children
 */
export function ChatHeaderBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "gap-3 flex items-center",
        // allow caller to add extra classes if desired
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Main header – retains the same exported name and API.
 *
 * Improvements:
 * - subtle glass background + backdrop blur
 * - responsive spacing and scalable logo card (uses existing /logo.png so no uploads)
 * - clearer center headline and subtitle
 * - keeps ThemeToggle on the right (unchanged)
 */
export function ChatHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <header
      className="w-full flex items-center justify-between py-4 px-4 sm:py-5 sm:px-6
                 bg-[color:var(--page-bg,#f7fdf8)]/80 dark:bg-[color:var(--page-bg-dark,#07141a)]/70
                 backdrop-blur-sm shadow-sm"
    >
      {/* LEFT SIDE: injected blocks (use ChatHeaderBlock to pass logo + text) */}
      <div className="flex items-center gap-4">
        {children}
      </div>

      {/* CENTER: headline (responsive; hidden on small screens) */}
      <div className="hidden md:flex flex-1 justify-center pointer-events-none">
        <div className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
          <span className="font-semibold mr-2">Chat with Greanly</span>
          <span className="text-slate-400 dark:text-slate-400">— Ask about plans, suppliers and practical steps</span>
        </div>
      </div>

      {/* RIGHT SIDE: Theme toggle (unchanged component) */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * OPTIONAL helper JSX you can use inline where you render ChatHeader:
 *
 * <ChatHeader>
 *   <ChatHeaderBlock>
 *     <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
 *                     bg-gradient-to-br from-[#e6f7e9] to-[#e9fff3] dark:from-[#062a24] dark:to-[#03302a]
 *                     shadow-inner overflow-hidden transform transition-transform duration-150 hover:scale-105">
 *       <img src="/logo.png" alt="Greanly logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
 *     </div>
 *
 *     <div className="flex flex-col leading-tight">
 *       <span className="text-base sm:text-lg font-semibold text-emerald-800 dark:text-emerald-300">
 *         Greanly
 *       </span>
 *       <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-200/80 -mt-0.5">
 *         AI + practical sustainability
 *       </span>
 *     </div>
 *   </ChatHeaderBlock>
 * </ChatHeader>
 *
 * You don't need to add this helper into your codebase — it's shown above as an example of how to compose
 * the improved left block using your existing exports.
 */
