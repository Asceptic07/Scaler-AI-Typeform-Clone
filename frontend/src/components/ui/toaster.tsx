"use client";
import { Toaster } from "sonner";
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      toastOptions={{ className: "app-toast" }}
    />
  );
}
