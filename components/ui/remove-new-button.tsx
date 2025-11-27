"use client";

import { useEffect } from "react";

/**
 * RemoveNewButton
 *
 * Small client-only utility that removes any button/link/role=button
 * whose exact visible text is "New" or "New Chat".
 *
 * Useful as a safe runtime workaround when the source of a duplicate
 * "New" button is hard to find. It does not alter your source files.
 */
export default function RemoveNewButton() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const isTargetText = (s?: string) => {
      if (!s) return false;
      const t = s.trim();
      return t === "New" || t === "New Chat";
    };

    // Remove nodes that match directly
    const scanAndRemove = (root: ParentNode = document) => {
      // buttons, links, and any element with role="button"
      const candidates = root.querySelectorAll<HTMLElement>("button, a, [role='button']");
      candidates.forEach((el) => {
        if (isTargetText(el.textContent)) {
          el.remove();
        }
      });
    };

    // initial pass
    scanAndRemove();

    // observe for dynamic additions (e.g., toolbars injected later)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((n) => {
            if (n instanceof HTMLElement) {
              // direct node
              if (isTargetText(n.textContent)) {
                n.remove();
                return;
              }
              // any buttons under it
              scanAndRemove(n);
            }
          });
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
    };
  }, []);

  return null;
}
