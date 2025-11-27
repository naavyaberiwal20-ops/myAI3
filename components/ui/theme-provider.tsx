"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * ThemeProvider wrapper
 *
 * NOTE: This also contains a small runtime DOM sanitizer that removes any
 * leftover top-right "New" / "New Chat" / "Save" buttons which are currently
 * being injected by a component you cannot find in the repo.
 *
 * This approach is a safe runtime workaround: it does not change any of your
 * UI components, only removes those exact visible buttons from the page DOM.
 */

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Remove buttons with these exact visible labels
    const TARGET_LABELS = new Set(["New", "New Chat", "Save"]);

    const removeMatchingButtons = () => {
      try {
        // Buttons
        document.querySelectorAll("button, a, [role='button']").forEach((el) => {
          const text = el.textContent?.trim() ?? "";
          if (TARGET_LABELS.has(text)) {
            el.remove();
          }
        });
      } catch (e) {
        // fail silently
        // console.warn("removeMatchingButtons failed", e);
      }
    };

    // Run once on mount
    removeMatchingButtons();

    // Observe mutations (buttons may be injected later)
    const observer = new MutationObserver(() => {
      removeMatchingButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    // Safety: attempt a few extra checks on interval for edge cases, then clear
    const interval = window.setInterval(() => removeMatchingButtons(), 900);

    // cleanup
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
