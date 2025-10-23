import { memo, useMemo } from "react";

// Security: Validate and freeze external URLs at build time
const SOCIAL_LINKS = Object.freeze([
    { 
        id: "discord",
        iconPath: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z",
        label: "Discord community", 
        href: "https://imaginears.club/d",
        description: "Join our Discord server",
        brandColor: "#5865F2", // Discord brand color
        hoverColor: "#4752C4"  // Darker shade for hover
    },
    { 
        id: "youtube",
        iconPath: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
        label: "Ride POVs", 
        href: "https://www.youtube.com/@imaginearsclub",
        description: "Watch on YouTube",
        brandColor: "#FF0000", // YouTube brand color (red)
        hoverColor: "#CC0000"  // Darker red for hover
    },
] as const);

// Performance: Memoized social link component
const SocialLink = memo(({ link }: { link: typeof SOCIAL_LINKS[number] }) => (
    <a
        href={link.href}
        target="_blank"
        // Security: Enhanced rel attributes for privacy and security
        rel="noopener noreferrer nofollow"
        // Security: Referrer policy to protect user privacy
        referrerPolicy="strict-origin-when-cross-origin"
        className="group flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 dark:hover:bg-black/5 transition-all duration-200"
        aria-label={link.description}
        style={{
            // CSS custom properties for brand colors
            ['--brand-color' as string]: link.brandColor,
            ['--brand-hover' as string]: link.hoverColor,
        }}
    >
        {/* Performance: Inline SVG instead of Image component for small icons */}
        <svg 
            className="w-5 h-5 transition-all duration-200 brightness-95 group-hover:brightness-100" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
                color: link.brandColor,
            }}
        >
            <path d={link.iconPath} />
        </svg>
        <span 
            className="text-sm font-medium transition-colors duration-200"
            style={{
                color: link.brandColor,
            }}
        >
            {link.label}
        </span>
        {/* Visual: External link indicator */}
        <svg 
            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-0.5 group-hover:translate-y-0 group-hover:translate-x-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
            style={{
                color: link.brandColor,
            }}
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    </a>
));

SocialLink.displayName = 'SocialLink';

function SocialProof() {
    // Performance: Memoize the links to prevent unnecessary re-renders
    const socialLinks = useMemo(() => SOCIAL_LINKS, []);

    return (
        <section className="band-alt" aria-labelledby="social-proof-heading">
            <div className="container py-8 md:py-10">
                <div className="card card-glass flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 id="social-proof-heading" className="text-base font-semibold text-body dark:text-white">
                            Join Our Community
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Connect with thousands of fellow guests who've experienced our magical parks
                        </p>
                    </div>
                    <div className="flex items-center gap-2" role="list">
                        {socialLinks.map((link) => (
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
