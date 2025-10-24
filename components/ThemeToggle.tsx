"use client";
import { useLayoutEffect, useRef, useState, useCallback } from "react";
import * as Switch from "@radix-ui/react-switch";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/common/Tooltip";

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

function readPersistedTheme(): Theme | null {
  try {
    // Use localStorage so theme persists across sessions and logout
    const v = localStorage.getItem(STORAGE_KEY);
    // Strict validation: only accept exact values
    if (v !== "dark" && v !== "light") return null;
    return v;
  } catch {
    // Storage may be disabled or in a restricted context
    return null;
  }
}

function writePersistedTheme(theme: Theme) {
  try {
    // Validate before writing
    if (theme !== "dark" && theme !== "light") {
      console.warn("[ThemeToggle] Attempted to write invalid theme:", theme);
      return;
    }
    // Use localStorage so theme persists across sessions and logout
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    // Log quota exceeded errors in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.warn("[ThemeToggle] Failed to write theme:", err);
    }
  }
}

function hasUserOverride(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
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
    const stored = readPersistedTheme();

    // Check if user has explicitly set a theme preference
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
      // Check both the ref AND storage to persist override across refreshes
      if (hasOverrideRef.current || hasUserOverride()) {
        if (process.env.NODE_ENV === "development") {
          console.log("[ThemeToggle] Ignoring system theme change (user override active)");
        }
        return;
      }
      const matches = "matches" in e ? e.matches : (e as MediaQueryListEvent).matches;
      const next: Theme = matches ? "dark" : "light";
      applyTheme(next);
      setDark(next === "dark");
      if (process.env.NODE_ENV === "development") {
        console.log("[ThemeToggle] Following system theme change:", next);
      }
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

  const toggle = useCallback((checked: boolean) => {
    const next: Theme = checked ? "dark" : "light";
    hasOverrideRef.current = true; // user explicitly chose a theme preference
    applyTheme(next);
    writePersistedTheme(next);
    setDark(checked);
  }, []);

  return (
    <Tooltip content={dark ? "Switch to light mode" : "Switch to dark mode"} side="bottom">
      <Switch.Root
        checked={dark}
        onCheckedChange={toggle}
        aria-label="Toggle theme"
        className={cn(
          "group relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center",
          "rounded-full border-2 border-transparent transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
          "data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700",
          "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500",
          "hover:data-[state=unchecked]:bg-slate-300 dark:hover:data-[state=unchecked]:bg-slate-600",
          "hover:data-[state=checked]:bg-blue-700 dark:hover:data-[state=checked]:bg-blue-600"
        )}
      >
        <Switch.Thumb
          className={cn(
            "pointer-events-none flex h-7 w-7 items-center justify-center",
            "rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
            "data-[state=unchecked]:translate-x-0",
            "data-[state=checked]:translate-x-6"
          )}
        >
          {dark ? (
            <Moon className="h-4 w-4 text-blue-600" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
          )}
        </Switch.Thumb>
      </Switch.Root>
    </Tooltip>
  );
}
