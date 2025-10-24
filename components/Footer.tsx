"use client";
import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";


// Security: Frozen constants prevent runtime tampering
const SERVER_ADDRESS = Object.freeze("imaginears.club" as const);
const BRAND_NAME = Object.freeze("Imaginears Club" as const);
const DISCLAIMER = Object.freeze("Not affiliated with The Walt Disney Company." as const);


// Validate server address format (basic DNS validation)
function isValidServerAddress(address: string): boolean {
  // Alphanumeric, dots, hyphens only (standard domain name)
  const domainPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  return domainPattern.test(address) && address.length <= 253; // RFC 1035 max length
}

export default function Footer() {
  // Track theme changes to force re-render when theme toggles
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Performance: Memoize year calculation to avoid recalculating on every render
  // Use UTC to avoid timezone edge cases and ensure consistency
  const year = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    // Security: Validate year is reasonable (prevent time-based attacks)
    if (currentYear < 2020 || currentYear > 2100) {
      console.warn("[Security] Invalid year detected:", currentYear);
      return 2024; // Fallback to safe default
    }
    return currentYear;
  }, []); // Empty deps = compute once per mount
  
  // Monitor theme changes and update component when theme toggles
  useEffect(() => {
    // Initial check
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };
    
    checkTheme();
    
    // Watch for attribute changes on <html> element
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

  // Security: Validate server address before rendering
  const safeServerAddress = useMemo(() => {
    if (!isValidServerAddress(SERVER_ADDRESS)) {
      console.error("[Security] Invalid server address:", SERVER_ADDRESS);
      return "invalid.server"; // Fallback
    }
    return SERVER_ADDRESS;
  }, []);

  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="mt-auto relative border-t shadow-inner"
      role="contentinfo"
      style={{
        backgroundColor: isDarkMode ? '#0b1221' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.8)',
      }}
    >
      {/* Visually hidden heading for landmark semantics */}
      <h2 id="site-footer-heading" className="sr-only">
        Site footer
      </h2>

      <div className="container py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        {/* Left Section: Branding & Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#8ecfff] to-[#5caeff] bg-clip-text text-transparent">
              Imaginears Club
            </span>
          </div>
          
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }} className="text-sm leading-relaxed">
            <span aria-label="Copyright">©</span>{" "}
            <time dateTime={String(year)} aria-label={`Copyright year ${year}`}>
              {year}
            </time>{" "}
            {BRAND_NAME}
            <br />
            <span className="text-xs" style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              {DISCLAIMER}
            </span>
          </p>
          
          <div className="flex items-center gap-2 pt-1">
            <svg className="w-4 h-4" style={{ fill: isDarkMode ? '#94a3b8' : '#64748b' }} viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>
            </svg>
            <p className="text-sm" style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>
              Minecraft server:{" "}
              <code 
                className="font-mono font-semibold px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                  color: isDarkMode ? '#f1f5f9' : '#0f172a'
                }}
                aria-label={`Server address: ${safeServerAddress}`}
              >
                {safeServerAddress}
              </code>
            </p>
          </div>
        </div>
        
        {/* Right Section: Tagline */}
        <div className="sm:text-right">
          <p 
            className="text-sm font-medium mb-1"
            style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
            aria-live="off" 
            role="contentinfo"
          >
            Made with <span aria-label="sparkles" className="inline-block animate-pulse">✨</span> and imagination
          </p>
          <div className="flex gap-3 mt-3 sm:justify-end">
            <a 
              href="https://discord.gg/imaginears" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-70"
              aria-label="Join our Discord"
              style={{ color: isDarkMode ? '#a5b4fc' : '#6366f1' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com/imaginears" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="transition-opacity hover:opacity-70" 
              aria-label="Follow us on Twitter"
              style={{ color: isDarkMode ? '#a5b4fc' : '#6366f1' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 640 640">
                <path d="M439.8 358.7C436.5 358.3 433.1 357.9 429.8 357.4C433.2 357.8 436.5 358.3 439.8 358.7zM320 291.1C293.9 240.4 222.9 145.9 156.9 99.3C93.6 54.6 69.5 62.3 53.6 69.5C35.3 77.8 32 105.9 32 122.4C32 138.9 41.1 258 47 277.9C66.5 343.6 136.1 365.8 200.2 358.6C203.5 358.1 206.8 357.7 210.2 357.2C206.9 357.7 203.6 358.2 200.2 358.6C106.3 372.6 22.9 406.8 132.3 528.5C252.6 653.1 297.1 501.8 320 425.1C342.9 501.8 369.2 647.6 505.6 528.5C608 425.1 533.7 372.5 439.8 358.6C436.5 358.2 433.1 357.8 429.8 357.3C433.2 357.7 436.5 358.2 439.8 358.6C503.9 365.7 573.4 343.5 593 277.9C598.9 258 608 139 608 122.4C608 105.8 604.7 77.7 586.4 69.5C570.6 62.4 546.4 54.6 483.2 99.3C417.1 145.9 346.1 240.4 320 291.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
