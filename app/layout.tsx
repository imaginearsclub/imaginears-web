import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Force Node.js runtime at the root to avoid accidental Edge usage by children that depend on Node-only modules.
export const runtime = "nodejs";

// Build a safe site URL for absolute metadata. Prefer NEXT_PUBLIC_SITE_URL if provided.
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "")) || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Imaginears Club",
  title: {
    default: "Imaginears Club",
    template: "%s | Imaginears Club",
  },
  description: "A magical Disney‑inspired Minecraft experience",
  keywords: ["Minecraft", "Disney", "Imaginears", "Theme Park", "Server"],
  authors: [{ name: "Imaginears Club" }],
  creator: "Imaginears Club",
  publisher: "Imaginears Club",
  category: "entertainment",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Imaginears Club",
    title: "Imaginears Club",
    description: "A magical Disney‑inspired Minecraft experience",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Imaginears Club",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imaginears Club",
    description: "A magical Disney‑inspired Minecraft experience",
    images: ["/og.png"],
    creator: "@imaginearsclub",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Imaginears Club",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh grid grid-rows-[auto_1fr_auto] bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
