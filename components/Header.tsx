"use client";
import Link from "next/link";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

// Allowed navigation paths - prevents injection attacks
const ALLOWED_PATHS = Object.freeze(new Set(["/events", "/about", "/apply", "/"]));

// Validate navigation href to prevent open redirects
function isValidPath(href: string): boolean {
  try {
    // Only allow relative paths starting with /
    if (!href.startsWith("/")) return false;
    // Prevent path traversal
    if (href.includes("..")) return false;
    // Check against allowed paths
    return ALLOWED_PATHS.has(href);
  } catch {
    return false;
  }
}

// Memoized NavLink to prevent unnecessary re-renders
const NavLink = memo(({ href, children }: { href: string; children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    
    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
    
    return () => observer.disconnect();
  }, []);

  // Security: Validate href before rendering
  if (!isValidPath(href)) {
    console.warn(`[Security] Invalid navigation path blocked: ${href}`);
    return null;
  }

  return (
    <Link
      href={href}
      className="relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group"
      style={{
        color: isDark ? '#cbd5e1' : '#475569',
      }}
      prefetch={true}
      aria-current={undefined}
    >
      <span className="relative z-10 group-hover:text-[#5caeff] transition-colors duration-200">
        {children}
      </span>
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          backgroundColor: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)',
        }}
      />
    </Link>
  );
});

NavLink.displayName = "NavLink";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Monitor theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && 
            (mutation.attributeName === "class" || mutation.attributeName === "data-theme")) {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{
        backgroundColor: isDarkMode 
          ? 'rgba(11, 18, 33, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
        borderColor: isDarkMode 
          ? 'rgba(71, 85, 105, 0.3)' 
          : 'rgba(226, 232, 240, 0.6)',
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Accessible skip link for keyboard users */}
      <a 
        href="#main" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
      
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg px-2 py-1 -ml-2 transition-all duration-200 hover:scale-105"
          aria-label="Imaginears Club - Go to homepage"
        >
          <div className="relative">
            <Image
              src="/images/logo.webp"
              width={40}
              height={40}
              alt="" // Empty alt since aria-label on parent provides context
              priority={true}
              quality={90}
              sizes="40px"
              unoptimized={false}
              className="transition-transform duration-300 group-hover:rotate-12"
            />
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              style={{
                background: 'radial-gradient(circle, rgba(92, 174, 255, 0.6) 0%, transparent 70%)',
              }}
            />
          </div>
          <span 
            className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#8ecfff] to-[#5caeff] bg-clip-text text-transparent"
            aria-hidden="false"
          >
            Imaginears Club
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-2" aria-label="Primary navigation">
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <NavLink href="/events">Events</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/apply">Apply</NavLink>
          </div>
          <div 
            className="h-6 w-px hidden sm:block"
            style={{ backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.3)' : 'rgba(203, 213, 225, 0.5)' }}
          />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
