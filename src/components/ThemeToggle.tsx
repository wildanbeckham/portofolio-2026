"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Aktifkan light mode" : "Aktifkan dark mode"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-border bg-surface text-ink transition-colors hover:border-accent hover:text-accent active:scale-[0.98] ${className}`}
    >
      {isDark ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
    </button>
  );
}
