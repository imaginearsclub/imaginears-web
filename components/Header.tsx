import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
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
  // Security: Validate href before rendering
  if (!isValidPath(href)) {
    console.warn(`[Security] Invalid navigation path blocked: ${href}`);
    return null;
  }

  return (
    <Link
      href={href}
      className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-200"
      prefetch={true} // Explicit boolean for clarity
      aria-current={undefined} // Will be set by Next.js Link
    >
      {children}
    </Link>
  );
});

NavLink.displayName = "NavLink";

// Extract className to const for performance (prevents recreation on each render)
const HEADER_CLASSES = "sticky top-0 z-50 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 bg-transparent dark:bg-[linear-gradient(180deg,rgba(13,23,40,0.85)_0%,rgba(10,15,25,0.60)_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.45)]";
const LOGO_CLASSES = "flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md";
const BRAND_TEXT_CLASSES = "font-bold tracking-wide text-slate-800 dark:text-white";

export default function Header() {
  return (
    <header className={HEADER_CLASSES}>
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
          className={LOGO_CLASSES}
          aria-label="Imaginears Club - Go to homepage"
        >
          <Image
            src="/images/logo.webp"
            width={36}
            height={36}
            alt="" // Empty alt since aria-label on parent provides context
            priority={true}
            quality={90} // Slightly reduce quality for performance
            sizes="36px"
            // Security: Prevent loading external images via src manipulation
            unoptimized={false}
          />
          <span className={BRAND_TEXT_CLASSES} aria-hidden="false">
            Imaginears Club
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-6" aria-label="Primary navigation">
          <NavLink href="/events">Events</NavLink>
          <NavLink href="/about">About</NavLink>
          <NavLink href="/apply">Apply</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
