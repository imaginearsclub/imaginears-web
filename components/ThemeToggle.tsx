"use client";
import { useLayoutEffect, useRef, useState, useCallback } from "react";

// Frozen constant to prevent tampering
const STORAGE_KEY = Object.freeze("imaginears.theme" as const);

type Theme = "light" | "dark";

// Apply theme synchronously to prevent flash and race conditions
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";
  
  // Apply immediately (synchronous) to prevent race conditions
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  
  root.setAttribute("data-theme", theme);
  
  // Log for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("[ThemeToggle] Applied theme:", theme, "| HTML has dark class:", root.classList.contains("dark"));
  }
}

function readSessionTheme(): Theme | null {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    // Strict validation: only accept exact values
    if (v !== "dark" && v !== "light") return null;
    return v;
  } catch {
    // Storage may be disabled or in a restricted context
    return null;
  }
}

function writeSessionTheme(theme: Theme) {
  try {
    // Validate before writing
    if (theme !== "dark" && theme !== "light") {
      console.warn("[ThemeToggle] Attempted to write invalid theme:", theme);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    // Log quota exceeded errors in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.warn("[ThemeToggle] Failed to write theme:", err);
    }
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const hasOverrideRef = useRef(false);
  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  // Use useLayoutEffect to prevent flash of wrong theme on page load
  // This runs synchronously before browser paint
  useLayoutEffect(() => {
    // Cache mediaQuery for performance (avoid repeated matchMedia calls)
    if (!mediaQueryRef.current) {
      mediaQueryRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    }
    const mq = mediaQueryRef.current;
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
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (hasOverrideRef.current) return;
      const matches = "matches" in e ? e.matches : (e as MediaQueryListEvent).matches;
      const next: Theme = matches ? "dark" : "light";
      applyTheme(next);
      setDark(next === "dark");
    };

    // Modern browsers support addEventListener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    } 
    // Legacy Safari support
    else if (typeof (mq as any).addListener === "function") {
      (mq as any).addListener(handleChange);
      return () => (mq as any).removeListener(handleChange);
    }

    return () => {};
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next: Theme = d ? "light" : "dark";
      hasOverrideRef.current = true; // user explicitly chose a theme for this session
      applyTheme(next);
      writeSessionTheme(next);
      return !d; // More efficient boolean toggle
    });
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      aria-pressed={dark}
      type="button" // Explicit type to prevent form submission
      className="rounded-full p-2 border border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-200"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
