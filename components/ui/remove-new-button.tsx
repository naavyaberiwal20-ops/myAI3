"use client";

import { useEffect } from "react";

/**
 * RemoveNewButton (header-only)
 *
 * Runtime helper that removes only the "New" / "New Chat" controls
 * that live inside header/top-control containers. This preserves
 * other buttons with the same text elsewhere (for example, the sidebar).
 */

const HEADER_SELECTORS = [
  ".top-controls",
  ".topbar",
  "header",
  ".header-controls",
  ".top-right",
];

function isTargetText(s?: string) {
  if (!s) return false;
  const t = s.trim();
  return t === "New" || t === "New Chat";
}

function removeFromContainer(container: ParentNode | null) {
  if (!container) return false;
  const candidates = Array.from(container.querySelectorAll<HTMLElement>("button, a, [role='button']"));
  let removed = false;
  for (const el of candidates) {
    if (isTargetText(el.textContent)) {
      el.remove();
      removed = true;
    }
  }
  return removed;
}

export default function RemoveNewButton() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Try removing from any header-like container immediately
    let done = false;
    for (const sel of HEADER_SELECTORS) {
      const el = document.querySelector(sel);
      if (removeFromContainer(el)) done = true;
    }

    // If done, we still observe in case header re-renders later (single-page nav)
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // if header nodes are added, scan them
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;

          // if the added node is a header-like container itself
          if (HEADER_SELECTORS.some((sel) => node.matches(sel))) {
            removeFromContainer(node);
            continue;
          }

          // otherwise, check if it contains a header-like container
          for (const sel of HEADER_SELECTORS) {
            const found = node.querySelector(sel);
            if (found) removeFromContainer(found);
          }

          // lastly, if the mutation added some controls directly (e.g., top-controls)
          // attempt a focused removal inside document's header-like containers
          for (const sel of HEADER_SELECTORS) {
            const headerEl = document.querySelector(sel);
            if (headerEl) removeFromContainer(headerEl);
          }
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    // As a safety, run one more targeted pass after a short delay (UI libs may render slightly later)
    const id = window.setTimeout(() => {
      for (const sel of HEADER_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) removeFromContainer(el);
      }
    }, 600);

    return () => {
      mo.disconnect();
      window.clearTimeout(id);
    };
  }, []);

  return null;
}
