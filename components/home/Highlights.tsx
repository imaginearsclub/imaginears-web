import { memo, useMemo } from "react";

// Security: Freeze highlight data at build time
const HIGHLIGHTS = Object.freeze([
    { 
        id: "daily-shows",
        title: "Daily Shows", 
        body: "Catch stunning Parades and Shows daily as well as meet and greets with your favorite characters.",
        icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
        id: "ride-classics",
        title: "Ride the Classics", 
        body: "Ride the classics like the Its a Small World, Star Tours, and Tower of Terror, with all rides being 100% accurate to the original, with full working ride-audio and full working ride-effects.",
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    { 
        id: "seasonal-magic",
        title: "Seasonal Magic", 
        body: "Special overlays and limited-time events all year. Like the Halloween event, May the 4th event, and more throught the parks, and as well on our seasonal event server.",
        icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
        gradient: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        iconColor: "text-amber-600 dark:text-amber-400"
    }
] as const);

// Performance: Memoized highlight card component
const HighlightCard = memo(({ highlight }: { highlight: typeof HIGHLIGHTS[number] }) => (
    <article 
        className="group relative card card-glass overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
        {/* Gradient accent bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${highlight.gradient}`} />
        
        {/* Icon with gradient background */}
        <div className="flex items-start gap-4">
            <div className={`shrink-0 w-14 h-14 rounded-xl ${highlight.bgColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <svg 
                    className={`w-7 h-7 ${highlight.iconColor}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={highlight.icon} />
                </svg>
            </div>
            
            <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xl font-bold text-body dark:text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400">
                    {highlight.title}
                </h3>
                <p className="mt-2 text-body leading-relaxed">
                    {highlight.body}
                </p>
            </div>
        </div>

        {/* Decorative corner element */}
        <div className={`absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br ${highlight.gradient} opacity-5 rounded-full transition-all duration-300 group-hover:scale-150 group-hover:opacity-10`} />
    </article>
));

HighlightCard.displayName = 'HighlightCard';

function Highlights() {
    // Performance: Memoize highlights array
    const highlights = useMemo(() => HIGHLIGHTS, []);

    return (
        <section aria-labelledby="highlights-heading">
            <div className="container py-12 md:py-16">
                <div className="text-center mb-10">
                    <h2 id="highlights-heading" className="section-title text-3xl md:text-4xl font-extrabold text-body dark:text-white">
                        Why Players Love It
                    </h2>
                    <p className="mt-3 text-lg text-body max-w-2xl mx-auto">
                        Experience the magic of Disney theme parks recreated in Minecraft with incredible attention to detail
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {highlights.map((highlight) => (
                        <HighlightCard key={highlight.id} highlight={highlight} />
                    ))}
                </div>

                {/* Stats bar */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                                15+
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                Attractions
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                                Daily
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                Events
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                                4
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                Parks
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                                24/7
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                Open
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(Highlights);
