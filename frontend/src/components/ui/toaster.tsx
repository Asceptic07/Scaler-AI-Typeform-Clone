"use client";
import { Toaster } from "sonner";
import type { CSSProperties } from "react";
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      style={{
        "--normal-bg": "var(--surface-raised, #fff)",
        "--normal-text": "var(--text-primary, #262624)",
        "--normal-border": "var(--border)",
      } as CSSProperties}
      toastOptions={{ className: "app-toast" }}
    />
  );
}
