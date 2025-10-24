import { memo } from "react";
import { Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { ExternalLink, Users } from "lucide-react";

// Security: Validate and freeze external URLs at build time
// Performance: Frozen const instead of useMemo
const SOCIAL_LINKS = Object.freeze([
    { 
        id: "discord",
        label: "Discord", 
        href: "https://imaginears.club/d",
        description: "Join our Discord server",
        members: "1.760+",
        icon: "discord" as const,
    },
    { 
        id: "youtube",
        label: "YouTube", 
        href: "https://www.youtube.com/@imaginearsclub",
        description: "Watch ride POVs and park content",
        members: "380+",
        icon: "youtube" as const,
    },
] as const);

// Security: URL validation helper
function isValidExternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only allow https URLs to external domains
        return parsed.protocol === 'https:' && parsed.hostname !== 'localhost';
    } catch {
        return false;
    }
}

// Performance: Memoized social link component with security validation
const SocialLink = memo(({ link }: { link: typeof SOCIAL_LINKS[number] }) => {
    // Security: Validate URL before rendering
    if (!isValidExternalUrl(link.href)) {
        console.error(`[SocialProof] Invalid URL: ${link.href}`);
        return null;
    }

    // Brand colors for Discord and YouTube using Tailwind-safe classes
    const brandStyles = {
        discord: {
            bg: "bg-[#5865F2] hover:bg-[#4752C4]",
            text: "text-white",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
            )
        },
        youtube: {
            bg: "bg-[#FF0000] hover:bg-[#CC0000]",
            text: "text-white",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
            )
        }
    };

    const style = brandStyles[link.icon];

    return (
        <a
            href={link.href}
            target="_blank"
            // Security: Enhanced rel attributes for privacy and security
            rel="noopener noreferrer nofollow"
            // Security: Referrer policy to protect user privacy
            referrerPolicy="strict-origin-when-cross-origin"
            className={cn(
                "group inline-flex flex-col gap-2 px-4 py-3 rounded-xl transition-all duration-200",
                "border-2 border-slate-300 dark:border-slate-700",
                "bg-white dark:bg-slate-900",
                "hover:shadow-lg hover:-translate-y-0.5",
                "hover:border-slate-400 dark:hover:border-slate-600",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
            aria-label={link.description}
        >
            <div className="flex items-center gap-2.5">
                {/* Brand icon */}
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-200",
                    style.bg,
                    "group-hover:scale-110"
                )}>
                    {style.icon}
                </div>
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {link.label}
                        </span>
                        <ExternalLink 
                            className={cn(
                                "w-3.5 h-3.5 opacity-0 transition-all duration-200",
                                "text-slate-500 dark:text-slate-400",
                                "group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            )}
                            aria-hidden="true"
                        />
                    </div>
                    <Badge variant="default" size="sm" className="self-start mt-0.5">
                        <Users className="w-3 h-3 mr-1" />
                        {link.members}
                    </Badge>
                </div>
            </div>
        </a>
    );
});

SocialLink.displayName = 'SocialLink';

/**
 * SocialProof component - displays community links with member counts
 * Performance: Memoized to prevent unnecessary re-renders
 * Security: Validates all external URLs before rendering
 */
function SocialProof() {
    return (
        <section className="band-alt" aria-labelledby="social-proof-heading">
            <div className="container py-8 md:py-10">
                <div className={cn(
                    "card card-glass flex-col md:flex-row items-center md:items-start justify-between gap-6",
                    "p-6 md:p-8"
                )}>
                    <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h2 
                                id="social-proof-heading" 
                                className="text-lg font-bold text-slate-900 dark:text-white"
                            >
                                Join Our Community
                            </h2>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connect with thousands of fellow guests across our social platforms
                        </p>
                    </div>
                      
                    <div className="flex flex-col sm:flex-row items-center gap-3" role="list">
                        {SOCIAL_LINKS.map((link) => (
                            <div key={link.id} role="listitem">
                                <SocialLink link={link} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(SocialProof);
