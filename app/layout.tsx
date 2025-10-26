import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Script from "next/script";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/common/Tooltip";
import { CookieConsent, ToastContainer } from "@/components/common";

// Force Node.js runtime at the root to avoid accidental Edge usage by children that depend on Node-only modules.
export const runtime = "nodejs";

// Build a safe site URL for absolute metadata. Prefer NEXT_PUBLIC_SITE_URL if provided.
const siteUrl = (process.env['NEXT_PUBLIC_SITE_URL']?.trim().replace(/\/$/, "")) || "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";

// SEO & Security: Comprehensive metadata with enhanced discoverability and protection
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Imaginears Club",
  title: {
    default: "Imaginears Club - Disney-Inspired Minecraft Server",
    template: "%s | Imaginears Club",
  },
  description: "Join Imaginears Club, a magical Disney-inspired Minecraft server featuring custom theme park rides, shows, and seasonal events. Family-friendly community for all ages.",
  keywords: [
    "Minecraft server",
    "Disney Minecraft",
    "Imaginears",
    "Theme park server",
    "Family-friendly Minecraft",
    "Minecraft events",
    "Custom builds",
    "Minecraft community",
    "Disney parks",
    "Creative server",
  ],
  authors: [{ name: "Imaginears Club", url: siteUrl }],
  creator: "Imaginears Club",
  publisher: "Imaginears Club",
  category: "entertainment",
  
  // Security: Control how site information appears when shared
  referrer: "strict-origin-when-cross-origin",
  
  // SEO: Canonical and alternate URLs
  alternates: {
    canonical: "/",
  },
  
  // SEO: Open Graph for rich social sharing
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Imaginears Club",
    title: "Imaginears Club - Disney-Inspired Minecraft Server",
    description: "Experience the magic of Disney in Minecraft! Join our family-friendly community for custom theme park rides, shows, and seasonal events.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Imaginears Club - Disney-Inspired Minecraft Experience",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },
  
  // SEO: Twitter Card for enhanced Twitter sharing
  twitter: {
    card: "summary_large_image",
    title: "Imaginears Club - Disney-Inspired Minecraft Server",
    description: "Experience the magic of Disney in Minecraft! Join our family-friendly community.",
    images: ["/og.png"],
    creator: "@imaginearsclub",
    site: "@imaginearsclub",
  },
  
  // Performance & SEO: Proper icon declarations
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Mobile optimization
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Imaginears Club",
  },
  
  // SEO: Additional metadata for better indexing
  formatDetection: {
    telephone: false, // Prevent auto-linking of numbers
    date: false,
    address: false,
    email: false,
  },
  
  // Security: Additional metadata directives
  other: {
    // Security: Prevent clickjacking
    "X-Frame-Options": "SAMEORIGIN",
    // Security: Prevent MIME-type sniffing
    "X-Content-Type-Options": "nosniff",
    // Security: Enable XSS protection (legacy browsers)
    "X-XSS-Protection": "1; mode=block",
    // Performance: DNS prefetch control
    "X-DNS-Prefetch-Control": "on",
  },
  
  // SEO: Robot directives (conditional based on environment)
  robots: isProd
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
      }
    : {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
      },
};

// Performance & Accessibility: Viewport configuration
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow zoom for accessibility
  userScalable: true, // Enable pinch-to-zoom for accessibility
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance: Critical inline script for flash-free theme initialization */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var d = document.documentElement;
                var key = 'imaginears.theme';
                var stored = null;
                try { stored = sessionStorage.getItem(key); } catch (e) {}
                
                // Default to light mode for better readability
                // Users can switch using the theme toggle in the header
                var theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
                
                if (theme === 'dark') { 
                  d.classList.add('dark'); 
                } else { 
                  d.classList.remove('dark'); 
                }
                d.setAttribute('data-theme', theme);
              } catch (e) {
                // Graceful degradation - default to light mode
                document.documentElement.classList.remove('dark');
                document.documentElement.setAttribute('data-theme', 'light');
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-dvh grid grid-rows-[auto_1fr_auto] antialiased transition-colors duration-300">
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
          {/* Semantic HTML structure for better SEO and accessibility */}
          <Header />
          {children}
          <Footer />
          
          {/* Toast notifications */}
          <Toaster 
            richColors 
            position="top-right" 
            expand={false}
            closeButton
            toastOptions={{
              classNames: {
                toast: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                title: 'text-slate-900 dark:text-white',
                description: 'text-slate-600 dark:text-slate-400',
                actionButton: 'bg-blue-500 text-white',
                cancelButton: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white',
                closeButton: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
              },
            }}
          />
          
          {/* Enhanced Toast Container with actions & progress */}
          <ToastContainer position="top-right" />
          
          {/* GDPR Cookie Consent */}
          <CookieConsent />
        </TooltipProvider>
      </body>
    </html>
  );
}
