import { memo } from "react";

// Security: Freeze server configuration at build time
const SERVER_CONFIG = Object.freeze({
    ip: "imaginears.club",
    port: "25565",
    minecraftVersion: "Java 1.20.x+",
    discordUrl: "https://imaginears.club/d",
} as const);

// Performance: Memoized CTA button component
const CTAButton = memo(({ 
    href, 
    label, 
    icon, 
    variant = "primary",
    external = false 
}: { 
    href: string; 
    label: string; 
    icon: React.ReactNode;
    variant?: "primary" | "secondary";
    external?: boolean;
}) => {
    const baseClasses = "group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl transition-all duration-200 overflow-hidden";
    const variantClasses = variant === "primary" 
        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-xl hover:-translate-y-0.5" 
        : "bg-white dark:bg-slate-800 backdrop-blur-sm border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm hover:shadow-md";
    
    const textClasses = variant === "primary"
        ? "text-white"
        : "text-slate-900 dark:text-white";

    return (
        <a
            href={href}
            className={`${baseClasses} ${variantClasses}`}
            aria-label={label}
            // Security: Enhanced attributes for external links
            {...(external ? {
                target: "_blank",
                rel: "noopener noreferrer nofollow",
                referrerPolicy: "strict-origin-when-cross-origin"
            } : {
                rel: "noopener"
            })}
        >
            {/* Shine effect on hover */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
            
            <span className={`relative flex items-center gap-2 font-bold ${textClasses}`}>
                {icon}
                {label}
            </span>
        </a>
    );
});

CTAButton.displayName = 'CTAButton';

function ServerCTA() {
    // Performance: Compute Minecraft protocol URL only once
    const minecraftServerUrl = `minecraft://?addExternalServer=Imaginears%20Club|${SERVER_CONFIG.ip}:${SERVER_CONFIG.port}`;

    return (
        <section
            className="relative isolate overflow-hidden band"
            data-surface="image"
            aria-labelledby="server-cta-heading"
        >
            {/* Enhanced gradient background with animated glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brandStart/25 via-blue-500/20 to-brandEnd/25 dark:from-brandStart/15 dark:via-blue-500/10 dark:to-brandEnd/15" />
            
            {/* Subtle animated dots pattern */}
            <div className="absolute inset-0 -z-10 opacity-20 dark:opacity-10" style={{
                backgroundImage: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
                backgroundSize: '30px 30px'
            }} />

            <div className="container py-12 md:py-16 relative z-10">
                <div className="card card-glass flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                    <div className="grow">
                        <div className="flex items-center gap-3 mb-3">
                            {/* Minecraft grass block icon */}
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8zm2 2v4h4v-4h-4z"/>
                                </svg>
                            </div>
                            <h2 id="server-cta-heading" className="text-2xl md:text-3xl font-bold text-body drop-shadow-sm">
                                Ready to Visit the Parks?
                            </h2>
                        </div>
                        
                        <p className="text-body leading-relaxed">
                            Add the server IP in Minecraft Java and hop in—our guides and mods
                            are happy to help you get started!
                        </p>
                        
                        {/* Server info cards */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/90 dark:bg-black/40 backdrop-blur-sm border border-slate-300 dark:border-slate-600">
                                <div className="shrink-0 w-8 h-8 rounded-md bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">Server IP</div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{SERVER_CONFIG.ip}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/90 dark:bg-black/40 backdrop-blur-sm border border-slate-300 dark:border-slate-600">
                                <div className="shrink-0 w-8 h-8 rounded-md bg-green-500 dark:bg-green-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">Version</div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{SERVER_CONFIG.minecraftVersion}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-white/90 dark:bg-black/40 backdrop-blur-sm border border-slate-300 dark:border-slate-600">
                                <div className="shrink-0 w-8 h-8 rounded-md bg-purple-500 dark:bg-purple-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wide">Support</div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">24/7 Available</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="shrink-0 flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
                        <CTAButton
                            href={minecraftServerUrl}
                            label="Add Server"
                            variant="primary"
                            icon={
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v8H8V8zm2 2v4h4v-4h-4z"/>
                                </svg>
                            }
                        />
                        <CTAButton
                            href={SERVER_CONFIG.discordUrl}
                            label="Join Discord"
                            variant="secondary"
                            external={true}
                            icon={
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            }
                        />
                        
                        {/* Application link */}
                        <a
                            href="/apply"
                            className="group text-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 underline decoration-transparent hover:decoration-current"
                        >
                            Apply to join our team →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(ServerCTA);
