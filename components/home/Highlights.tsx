import { memo } from "react";
import { Badge, Separator } from "@/components/common";
import { cn } from "@/lib/utils";
import { Ticket, Zap, Sparkles } from "lucide-react";

// Security: Freeze highlight data at build time
const HIGHLIGHTS = Object.freeze([
    { 
        id: "daily-shows",
        title: "Daily Shows", 
        body: "Catch stunning Parades and Shows daily as well as meet and greets with your favorite characters.",
        icon: Ticket,
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
        id: "ride-classics",
        title: "Ride the Classics", 
        body: "Ride the classics like It's a Small World, Star Tours, and Tower of Terror, with all rides being 100% accurate to the original, with full working ride-audio and full working ride-effects.",
        icon: Zap,
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    { 
        id: "seasonal-magic",
        title: "Seasonal Magic", 
        body: "Special overlays and limited-time events all year. Like the Halloween event, May the 4th event, and more throughout the parks, and as well on our seasonal event server.",
        icon: Sparkles,
        gradient: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        iconColor: "text-amber-600 dark:text-amber-400"
    }
] as const);

// Performance: Memoized highlight card component
const HighlightCard = memo(({ highlight }: { highlight: typeof HIGHLIGHTS[number] }) => {
    const Icon = highlight.icon;
    
    return (
        <article 
            className={cn(
                "group relative card card-glass overflow-hidden",
                "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                "p-6"
            )}
        >
            {/* Gradient accent bar at top */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1",
                `bg-gradient-to-r ${highlight.gradient}`
            )} />
            
            {/* Icon with gradient background */}
            <div className="flex items-start gap-4">
                <div className={cn(
                    "shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
                    "transition-transform duration-300",
                    "group-hover:scale-110 group-hover:rotate-3",
                    highlight.bgColor
                )}>
                    <Icon 
                        className={cn("w-7 h-7", highlight.iconColor)}
                        aria-hidden="true"
                    />
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                    <h3 className={cn(
                        "text-xl font-bold transition-all duration-300",
                        "text-slate-900 dark:text-white",
                        "group-hover:text-transparent group-hover:bg-clip-text",
                        "group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600",
                        "dark:group-hover:from-blue-400 dark:group-hover:to-purple-400"
                    )}>
                        {highlight.title}
                    </h3>
                    <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {highlight.body}
                    </p>
                </div>
            </div>

            {/* Decorative corner element */}
            <div className={cn(
                "absolute -bottom-8 -right-8 w-24 h-24 rounded-full",
                "transition-all duration-300",
                "opacity-5 group-hover:scale-150 group-hover:opacity-10",
                `bg-gradient-to-br ${highlight.gradient}`
            )} />
        </article>
    );
});

HighlightCard.displayName = 'HighlightCard';

/**
 * Highlights component - displays key features and stats
 * Performance: Memoized to prevent unnecessary re-renders
 * Security: All content is frozen at build time
 */
function Highlights() {
    return (
        <section aria-labelledby="highlights-heading">
            <div className="container py-12 md:py-16">
                <div className="text-center mb-10">
                    <h2 
                        id="highlights-heading" 
                        className="section-title text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white"
                    >
                        Why Players Love It
                    </h2>
                    <p className="mt-3 text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
                        Experience the magic of Disney theme parks recreated in Minecraft with incredible attention to detail
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {HIGHLIGHTS.map((highlight) => (
                        <HighlightCard key={highlight.id} highlight={highlight} />
                    ))}
                </div>

                {/* Stats bar with enhanced styling */}
                <div className="mt-12">
                    <Separator className="mb-8" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="group">
                            <div className={cn(
                                "text-3xl md:text-4xl font-bold",
                                "text-transparent bg-clip-text bg-gradient-to-r",
                                "from-blue-600 to-cyan-600",
                                "dark:from-blue-400 dark:to-cyan-400",
                                "transition-transform duration-300 group-hover:scale-110"
                            )}>
                                15+
                            </div>
                            <Badge variant="default" size="sm" className="mt-2">
                                Attractions
                            </Badge>
                        </div>
                        
                        <div className="group">
                            <div className={cn(
                                "text-3xl md:text-4xl font-bold",
                                "text-transparent bg-clip-text bg-gradient-to-r",
                                "from-purple-600 to-pink-600",
                                "dark:from-purple-400 dark:to-pink-400",
                                "transition-transform duration-300 group-hover:scale-110"
                            )}>
                                Daily
                            </div>
                            <Badge variant="primary" size="sm" className="mt-2">
                                Events
                            </Badge>
                        </div>
                        
                        <div className="group">
                            <div className={cn(
                                "text-3xl md:text-4xl font-bold",
                                "text-transparent bg-clip-text bg-gradient-to-r",
                                "from-amber-600 to-orange-600",
                                "dark:from-amber-400 dark:to-orange-400",
                                "transition-transform duration-300 group-hover:scale-110"
                            )}>
                                4
                            </div>
                            <Badge variant="warning" size="sm" className="mt-2">
                                Parks
                            </Badge>
                        </div>
                        
                        <div className="group">
                            <div className={cn(
                                "text-3xl md:text-4xl font-bold",
                                "text-transparent bg-clip-text bg-gradient-to-r",
                                "from-green-600 to-emerald-600",
                                "dark:from-green-400 dark:to-emerald-400",
                                "transition-transform duration-300 group-hover:scale-110"
                            )}>
                                24/7
                            </div>
                            <Badge variant="success" size="sm" className="mt-2">
                                Open
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default memo(Highlights);
