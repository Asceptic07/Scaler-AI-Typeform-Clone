export type Appearance = "light" | "dark";

export const APPEARANCE_KEY = "typeform-clone-theme";
const APPEARANCE_EVENT = "typeform-clone-appearance-change";

export function savedAppearance(): Appearance | null {
  try {
    const value = localStorage.getItem(APPEARANCE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function applyAppearance(appearance: Appearance) {
  document.documentElement.dataset.theme = appearance;
  window.dispatchEvent(new Event(APPEARANCE_EVENT));
}

export function subscribeAppearance(onChange: () => void) {
  window.addEventListener(APPEARANCE_EVENT, onChange);
  return () => window.removeEventListener(APPEARANCE_EVENT, onChange);
}

export function currentAppearance(): Appearance {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function serverAppearance(): Appearance {
  return "light";
}

// Runs in the document head before paint, independently of React hydration.
export const appearanceInitialization = `(() => {
  let saved;
  try { saved = localStorage.getItem("${APPEARANCE_KEY}"); } catch {}
  document.documentElement.dataset.theme = saved === "light" || saved === "dark"
    ? saved : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
})();`;
