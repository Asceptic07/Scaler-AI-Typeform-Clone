"use client";

import { useEffect } from "react";
import { APPEARANCE_KEY, applyAppearance, savedAppearance } from "@/lib/appearance";

export function AppearanceSync() {
  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    function sync() {
      applyAppearance(savedAppearance() ?? (system.matches ? "dark" : "light"));
    }
    function storageChange(event: StorageEvent) {
      if (event.key === APPEARANCE_KEY || event.key === null) sync();
    }
    function systemChange() {
      if (!savedAppearance()) sync();
    }
    sync();
    system.addEventListener("change", systemChange);
    window.addEventListener("storage", storageChange);
    return () => {
      system.removeEventListener("change", systemChange);
      window.removeEventListener("storage", storageChange);
    };
  }, []);
  return null;
}
