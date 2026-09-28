"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  function sync() {
    let stored: string | null = null;
    try { stored = localStorage.getItem("theme"); } catch { /* System preference works without storage. */ }
    document.documentElement.classList.toggle("dark", stored === "dark" || (stored !== "light" && media.matches));
  }
  sync();
  media.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  return () => { observer.disconnect(); media.removeEventListener("change", sync); window.removeEventListener("storage", sync); };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as const);
  function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("theme", next); } catch { /* Keep the theme usable when storage is blocked. */ }
  }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
