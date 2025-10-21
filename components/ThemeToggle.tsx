"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const STORAGE_KEY = "imaginears.theme"; // session-scoped override

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Toggle Tailwind's class strategy and set a data attribute for potential CSS hooks
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
}

function readSessionTheme(): Theme | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    // Storage may be disabled or in a restricted context
    return null;
  }
}

function writeSessionTheme(theme: Theme) {
  try {
    sessionStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore write failures (private mode or quota)
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const hasOverrideRef = useRef(false);

  // Initialize from session override or system preference. Also watch system changes when no override exists.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = readSessionTheme();

    if (stored) {
      hasOverrideRef.current = true;
      applyTheme(stored);
      setDark(stored === "dark");
    } else {
      const prefersDark = mq.matches;
      applyTheme(prefersDark ? "dark" : "light");
      setDark(prefersDark);
    }

    // Respond to system theme changes only if no user override is set
    const handleChange = (e: MediaQueryListEvent) => {
      if (hasOverrideRef.current) return;
      const next: Theme = e.matches ? "dark" : "light";
      applyTheme(next);
      setDark(next === "dark");
    };

    // Older Safari uses addListener/removeListener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    } else if (typeof (mq as any).addListener === "function") {
      (mq as any).addListener(handleChange);
      return () => (mq as any).removeListener(handleChange);
    }

    return () => {};
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = d ? "light" : "dark" as Theme;
      hasOverrideRef.current = true; // user explicitly chose a theme for this session
      applyTheme(next);
      writeSessionTheme(next);
      return next === "dark";
    });
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      aria-pressed={dark}
      className="rounded-full p-2 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
