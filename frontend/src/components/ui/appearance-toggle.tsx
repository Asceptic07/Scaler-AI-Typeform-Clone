"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import {
  APPEARANCE_KEY,
  applyAppearance,
  currentAppearance,
  serverAppearance,
  subscribeAppearance,
} from "@/lib/appearance";

export function AppearanceToggle() {
  const appearance = useSyncExternalStore(
    subscribeAppearance,
    currentAppearance,
    serverAppearance,
  );
  const dark = appearance === "dark";
  return (
    <button
      type="button"
      className="icon-button appearance-toggle"
      aria-label="Dark mode"
      aria-pressed={dark}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next = dark ? "light" : "dark";
        try {
          localStorage.setItem(APPEARANCE_KEY, next);
        } catch {
          // Appearance remains usable when browser storage is unavailable.
        }
        applyAppearance(next);
      }}
    >
      {dark ? (
        <Moon size={17} aria-hidden="true" />
      ) : (
        <Sun size={17} aria-hidden="true" />
      )}
    </button>
  );
}
