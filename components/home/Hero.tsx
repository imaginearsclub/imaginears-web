"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { Calendar, Server, CheckCircle, ExternalLink, Copy, Check } from "lucide-react";
import { Badge, Tooltip } from "@/components/common";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import castle from "@/public/images/hero/castle.webp";

// Security: Validate external URLs
function isValidExternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
        return false;
    }
}

// Security: Sanitize server IP/domain for display
function sanitizeServerIP(ip: string): string {
    // Allow alphanumeric, dots, dashes, and subdomains
    return ip.replace(/[^a-zA-Z0-9.\-]/g, '').slice(0, 100);
}

// Security: Freeze server info at build time
const SERVER_INFO = Object.freeze({
    ip: "imaginears.club",
    version: "Java 1.24.x+",
    status: "Online",
    statusDetail: "Community-run",
    discordUrl: "https://imaginears.club/d",
} as const);

// Performance: Memoized CTA button component
const CTAButton = memo(({ 
    href, 
    children, 
    external = false,
    icon 
}: { 
    href: string; 
    children: React.ReactNode; 
    external?: boolean;
    icon: React.ReactNode;
}) => {
    // Security: Validate external URLs
    if (external && !isValidExternalUrl(href)) {
        console.error(`[Hero] Invalid external URL: ${href}`);
        return null;
    }

    const linkProps = external ? {
        target: "_blank" as const,
        rel: "noopener noreferrer nofollow",
        referrerPolicy: "strict-origin-when-cross-origin" as const,
    } : {};

    const buttonClass = cn(
        "group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold transition-all duration-300 overflow-hidden",
        "bg-gradient-to-r from-blue-600 to-purple-600",
        "hover:from-blue-700 hover:to-purple-700",
        "shadow-lg hover:shadow-2xl hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    );

    const content = (
        <>
            {/* Shine effect */}
            <span 
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" 
                aria-hidden="true" 
            />
            <span className="relative flex items-center gap-2 text-white">
                {icon}
                {children}
                {external && (
                    <ExternalLink 
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        aria-hidden="true" 
                    />
                )}
            </span>
        </>
    );

    if (external) {
        return (
            <a href={href} className={buttonClass} {...linkProps}>
                {content}
            </a>
        );
    }

    return (
        <Link href={href} className={buttonClass}>
            {content}
        </Link>
    );
});

CTAButton.displayName = 'CTAButton';

// Performance: Memoized info card component with optional click-to-copy
const InfoCard = memo(({ 
    label, 
    value, 
    icon,
    tooltip,
    copyable = false
}: { 
    label: string; 
    value: string; 
    icon: React.ReactNode;
    tooltip?: string;
    copyable?: boolean;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!copyable) return;
        
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success(`Copied "${value}" to clipboard!`);
            
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error("[Hero] Failed to copy to clipboard:", err);
            toast.error("Failed to copy to clipboard");
        }
    };

    const card = (
        <div 
            className={cn(
                "group rounded-2xl p-4 border-2 transition-all duration-300",
                "bg-white/95 dark:bg-slate-800/95 backdrop-blur-md",
                "border-slate-200 dark:border-slate-700",
                "shadow-lg hover:shadow-2xl hover:-translate-y-0.5",
                "hover:border-slate-300 dark:hover:border-slate-600",
                copyable && [
                    "cursor-pointer select-none",
                    "active:scale-[0.98]",
                    copied && "border-green-500 dark:border-green-500"
                ]
            )}
            onClick={handleCopy}
            role={copyable ? "button" : undefined}
            aria-label={copyable ? `Copy ${value} to clipboard` : undefined}
            tabIndex={copyable ? 0 : undefined}
            onKeyDown={copyable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopy();
                }
            } : undefined}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md",
                    "bg-gradient-to-br from-blue-500 to-purple-500",
                    "group-hover:scale-110 group-hover:rotate-3",
                    copied && "bg-gradient-to-br from-green-500 to-emerald-500"
                )}>
                    {copied ? (
                        <Check className="w-6 h-6 text-white" aria-hidden="true" />
                    ) : (
                        icon
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="default" size="sm">
                            {label}
                        </Badge>
                        {copyable && !copied && (
                            <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        )}
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );

    if (tooltip) {
        return (
            <Tooltip content={tooltip}>
                {card}
            </Tooltip>
        );
    }

    return card;
});

InfoCard.displayName = 'InfoCard';

function Hero() {
    // Performance: Memoize and sanitize server info
    const safeServerIP = useMemo(() => sanitizeServerIP(SERVER_INFO.ip), []);
    const serverInfo = useMemo(() => SERVER_INFO, []);

    return (
        <section
            className={cn(
                "relative isolate overflow-hidden band-alt"
            )}
            data-surface="image"
            aria-labelledby="hero-heading"
        >
            {/* Background image with enhanced overlay */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src={castle}
                    alt="Enchanted castle at night with magical fireworks display"
                    fill
                    priority
                    quality={90}
                    className="object-cover"
                    placeholder="blur"
                    sizes="100vw"
                />
                {/* Enhanced gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30 dark:to-slate-950/60" />
                
                {/* Subtle animated gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/10 opacity-50" />
            </div>

            <div className="container py-24 md:py-32 relative z-10">
                {/* Main heading with enhanced styling */}
                <div className="max-w-4xl">
                    <h1 id="hero-heading" className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Imaginears Club
                    </h1>
                    
                    {/* Enhanced subtitle with better readability */}
                    <p className="mt-6 max-w-2xl text-xl md:text-2xl text-white/95 drop-shadow-lg leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    Bringing the magic of Disney theme parks to life in Minecraft, with working rides, shows, and seasonal events crafted by fans for fans. Family-friendly, welcoming, and always magical. ✨
                    </p>

                    {/* CTA buttons with icons */}
                    <div className="mt-10 flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <CTAButton 
                            href="/events"
                            icon={<Calendar className="w-5 h-5" aria-hidden="true" />}
                        >
                            See Events
                        </CTAButton>
                        
                        <CTAButton 
                            href={serverInfo.discordUrl}
                            external
                            icon={
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                                </svg>
                            }
                        >
                            Join Discord
                        </CTAButton>
                    </div>
                </div>

                {/* Enhanced info cards */}
                <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                    <InfoCard
                        label="Server IP"
                        value={safeServerIP}
                        icon={<Server className="w-6 h-6 text-white" aria-hidden="true" />}
                        tooltip="Click to copy server address and join in Minecraft"
                        copyable
                    />
                    
                    <InfoCard
                        label="Version"
                        value={serverInfo.version}
                        icon={<CheckCircle className="w-6 h-6 text-white" aria-hidden="true" />}
                        tooltip="Compatible with Java Edition 1.24.x and newer versions"
                    />
                    
                    <InfoCard
                        label="Status"
                        value={`${serverInfo.status} • ${serverInfo.statusDetail}`}
                        icon={<CheckCircle className="w-6 h-6 text-white" aria-hidden="true" />}
                        tooltip="Server is currently online and accepting connections"
                    />
                </div>
            </div>
        </section>
    );
}

export default memo(Hero);
