"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

/**
 * ThemeToggle
 * - Shows a compact tri-state toggle: Light / Dark / System
 * - Uses next-themes (ThemeProvider should already be set up in layout)
 *
 * Usage:
 * import { ThemeToggle } from "@/components/ui/theme-toggle";
 * <ThemeToggle />
 */

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch: wait until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // determine current effective theme label
  const effectiveTheme = theme === "system" ? systemTheme : theme;

  const buttonClass =
    "inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border border-input shadow-sm hover:opacity-95 transition-all";

  return (
    <div className="inline-flex items-center gap-2">
      {/* Light */}
      <button
        aria-label="Switch to light theme"
        title="Light"
        className={`${buttonClass} ${effectiveTheme === "light" ? "bg-card text-card-foreground" : "bg-transparent"}`}
        onClick={() => setTheme("light")}
        type="button"
      >
        <Sun className="w-4 h-4" />
        <span className="hidden sm:inline">Light</span>
      </button>

      {/* System */}
      <button
        aria-label="Use system theme"
        title="System"
        className={`${buttonClass} ${theme === "system" ? "bg-card text-card-foreground" : "bg-transparent"}`}
        onClick={() => setTheme("system")}
        type="button"
      >
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">System</span>
      </button>

      {/* Dark */}
      <button
        aria-label="Switch to dark theme"
        title="Dark"
        className={`${buttonClass} ${effectiveTheme === "dark" ? "bg-card text-card-foreground" : "bg-transparent"}`}
        onClick={() => setTheme("dark")}
        type="button"
      >
        <Moon className="w-4 h-4" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
