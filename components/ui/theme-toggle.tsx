"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  const buttonClass =
    "inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border border-input shadow-sm hover:opacity-95 transition-all";

  return (
    <div className="inline-flex items-center gap-2">

      {/* System FIRST */}
      <button
        aria-label="Use system theme"
        title="System"
        className={`${buttonClass} ${
          theme === "system" ? "bg-card text-card-foreground" : "bg-transparent"
        }`}
        onClick={() => setTheme("system")}
        type="button"
      >
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">System</span>
      </button>

      {/* Light SECOND */}
      <button
        aria-label="Switch to light theme"
        title="Light"
        className={`${buttonClass} ${
          effectiveTheme === "light"
            ? "bg-card text-card-foreground"
            : "bg-transparent"
        }`}
        onClick={() => setTheme("light")}
        type="button"
      >
        <Sun className="w-4 h-4" />
        <span className="hidden sm:inline">Light</span>
      </button>

      {/* Dark THIRD */}
      <button
        aria-label="Switch to dark theme"
        title="Dark"
        className={`${buttonClass} ${
          effectiveTheme === "dark"
            ? "bg-card text-card-foreground"
            : "bg-transparent"
        }`}
        onClick={() => setTheme("dark")}
        type="button"
      >
        <Moon className="w-4 h-4" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
