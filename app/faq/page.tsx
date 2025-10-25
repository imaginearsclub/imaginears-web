"use client";

import { useState, useMemo } from "react";
import { Breadcrumb, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Input, Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { Search, HelpCircle, Server, Calendar, UserPlus, Settings } from "lucide-react";

// FAQ categories with icons
const categories = [
    { id: "server", label: "Server", icon: Server, color: "text-blue-600 dark:text-blue-400" },
    { id: "events", label: "Events", icon: Calendar, color: "text-purple-600 dark:text-purple-400" },
    { id: "applications", label: "Applications", icon: UserPlus, color: "text-green-600 dark:text-green-400" },
    { id: "technical", label: "Technical", icon: Settings, color: "text-orange-600 dark:text-orange-400" },
] as const;

type CategoryId = typeof categories[number]["id"];

interface FAQItem {
    id: string;
    category: CategoryId;
    question: string;
    answer: string;
    keywords: string[]; // For search
}

// Comprehensive FAQ data
const faqs: FAQItem[] = [
    // Server Category
    {
        id: "what-is-imaginears",
        category: "server",
        question: "What is Imaginears Club?",
        answer: "Imaginears Club is a family-friendly, Disney-inspired Minecraft server created by fans for fans. We recreate magical Disney experiences in Minecraft with custom rides, shows, parades, seasonal events, and more. Our community is welcoming, creative, and passionate about bringing the magic of Disney to Minecraft!",
        keywords: ["about", "what", "imaginears", "disney", "minecraft", "server", "community"],
    },
    {
        id: "how-to-join",
        category: "server",
        question: "How do I join the server?",
        answer: "To join Imaginears Club, you'll need Minecraft Java Edition. Simply add our server address in the multiplayer menu. The exact address can be found on our Discord server or homepage. Make sure you're using the correct Minecraft version (check our homepage for the current version). If you're new, feel free to explore as a guest before applying for full membership!",
        keywords: ["join", "connect", "address", "ip", "how", "start"],
    },
    {
        id: "minecraft-version",
        category: "server",
        question: "What version of Minecraft do I need?",
        answer: "Imaginears Club runs on Minecraft Java Edition. We regularly update to the latest stable version of Minecraft. Check our homepage or Discord for the current required version. Bedrock Edition is not currently supported, but we're exploring options for cross-play in the future.",
        keywords: ["version", "java", "bedrock", "edition", "compatibility"],
    },
    {
        id: "server-rules",
        category: "server",
        question: "What are the server rules?",
        answer: "We maintain a family-friendly environment with strict rules: 1) Be respectful to all players and staff, 2) No griefing, stealing, or destroying others' builds, 3) Keep language appropriate for all ages, 4) No hacking, cheating, or exploiting, 5) Follow staff instructions, 6) Respect Disney's intellectual property (no unofficial merchandise sales). Breaking these rules may result in warnings, temporary bans, or permanent bans depending on severity.",
        keywords: ["rules", "regulations", "behavior", "conduct", "banned", "kick"],
    },
    {
        id: "server-status",
        category: "server",
        question: "Is the server always online?",
        answer: "Yes! Imaginears Club runs 24/7 on dedicated servers with 99.9% uptime. We occasionally have scheduled maintenance (announced in advance on Discord) or brief restarts for updates. If you can't connect, check our Discord for any announcements or visit our status page. You can also check the live player count on our homepage.",
        keywords: ["online", "offline", "uptime", "downtime", "maintenance", "status"],
    },

    // Events Category
    {
        id: "what-are-events",
        category: "events",
        question: "What types of events do you host?",
        answer: "We host a variety of magical events including: Fireworks shows with custom effects, Character meet-and-greets with staff roleplay, Parades with custom floats and music, Seasonal overlays (Halloween, Christmas, etc.), Special celebrations for Disney anniversaries, Building competitions, Community game nights, and exclusive premieres for new attractions. Check our Events page for the full schedule!",
        keywords: ["events", "activities", "types", "what", "schedule"],
    },
    {
        id: "event-times",
        category: "events",
        question: "When do events happen?",
        answer: "Events are scheduled throughout the week at various times to accommodate different time zones. We display all times in Eastern Time (ET) by default, but you can see countdowns on event cards showing exactly when they start. Most events are recurring weekly or monthly. Check our Events page to see upcoming times and add events to your personal calendar!",
        keywords: ["when", "time", "schedule", "timezone", "frequency"],
    },
    {
        id: "attend-events",
        category: "events",
        question: "Do I need to register for events?",
        answer: "No registration required! Most events are open to all players. Simply log into the server at the scheduled time and head to the event location. Some special events (like limited-capacity meet-and-greets) may require signing up in advance via Discord. Event details will specify if registration is needed.",
        keywords: ["register", "signup", "rsvp", "attend", "join"],
    },
    {
        id: "suggest-events",
        category: "events",
        question: "Can I suggest event ideas?",
        answer: "Absolutely! We love community input. Share your event ideas in our Discord server's #suggestions channel. Our events team reviews all suggestions and considers them for future programming. Popular ideas that fit our vision and resources often get implemented!",
        keywords: ["suggest", "idea", "propose", "request", "feedback"],
    },
    {
        id: "missed-event",
        category: "events",
        question: "What if I miss an event?",
        answer: "Most of our events are recurring, so you'll have another chance! Check the event details to see if it repeats weekly, monthly, or seasonally. We also post event highlights and recordings in our Discord server so you can see what you missed. Follow us on social media to stay updated on all events!",
        keywords: ["missed", "recording", "replay", "catch up"],
    },

    // Applications Category
    {
        id: "who-can-apply",
        category: "applications",
        question: "Who can apply to be staff?",
        answer: "Anyone passionate about Disney, Minecraft, and helping others can apply! We look for mature, responsible players who are active in the community, follow server rules, and want to contribute. You don't need prior staff experience, but being a regular player helps us get to know you. Applications are open year-round.",
        keywords: ["apply", "staff", "who", "requirements", "qualifications"],
    },
    {
        id: "staff-roles",
        category: "applications",
        question: "What staff roles are available?",
        answer: "We have several roles: Guest Experience (help guests navigate the server), Imagineer (build and maintain attractions), Entertainment (host events and roleplay characters), Developer (work on plugins and technical features), and Moderator (enforce rules and handle reports). You can indicate your preferred role(s) in the application.",
        keywords: ["roles", "positions", "jobs", "staff", "types"],
    },
    {
        id: "application-process",
        category: "applications",
        question: "What is the application process?",
        answer: "The process is simple: 1) Fill out our online application form with your info, experience, and why you want to join, 2) Our team reviews your application (usually within 1-2 weeks), 3) If selected, you'll have an interview on Discord, 4) If approved, you'll start a training period with mentorship, 5) After completing training, you become a full staff member! We'll keep you updated via email throughout the process.",
        keywords: ["process", "steps", "how", "timeline", "interview"],
    },
    {
        id: "application-status",
        category: "applications",
        question: "How do I check my application status?",
        answer: "After submitting, you'll receive a confirmation email. We'll contact you via email for next steps. The review process takes 1-2 weeks depending on volume. If you haven't heard back after 2 weeks, feel free to reach out on Discord or email us. We review every application carefully!",
        keywords: ["status", "check", "review", "waiting", "response"],
    },
    {
        id: "apply-again",
        category: "applications",
        question: "Can I reapply if I'm rejected?",
        answer: "Yes! If your application isn't accepted, we encourage you to stay active in the community and reapply after 3 months. We provide feedback on why you weren't selected (if requested) so you can improve your next application. Many of our current staff members were accepted on their second or third try!",
        keywords: ["reapply", "rejected", "denied", "try again", "second chance"],
    },

    // Technical Category
    {
        id: "lag-issues",
        category: "technical",
        question: "I'm experiencing lag. What should I do?",
        answer: "Lag can be caused by several factors: 1) Check your internet connection, 2) Lower your Minecraft render distance and graphics settings, 3) Close other programs using bandwidth, 4) Try connecting at different times (less busy hours), 5) Make sure you're using the correct server version. If issues persist, report it in Discord with details (your location, when it happens, error messages) so we can investigate.",
        keywords: ["lag", "slow", "performance", "fps", "connection"],
    },
    {
        id: "cant-connect",
        category: "technical",
        question: "I can't connect to the server. Help!",
        answer: "Common solutions: 1) Verify you're using Minecraft Java Edition at the correct version, 2) Check if the server is online (homepage or Discord), 3) Restart your Minecraft client, 4) Check your firewall isn't blocking Minecraft, 5) Try flushing your DNS cache, 6) Verify you've entered the correct server address. If none of this works, ask for help in our Discord #support channel with any error messages you see.",
        keywords: ["connect", "connection", "error", "join", "unable", "failed"],
    },
    {
        id: "optifine-mods",
        category: "technical",
        question: "Can I use Optifine or other mods?",
        answer: "Yes! Optifine and performance mods are allowed and encouraged. Visual mods (shaders, texture packs) are also fine. We DO NOT allow any mods that give unfair advantages (x-ray, flying in survival, auto-miners, etc.). Resource packs that enhance the Disney experience are welcome! When in doubt, ask a staff member before using a mod.",
        keywords: ["optifine", "mods", "shaders", "allowed", "resource pack", "texture"],
    },
    {
        id: "report-bugs",
        category: "technical",
        question: "How do I report bugs or issues?",
        answer: "Report technical issues in our Discord #bug-reports channel. Please include: 1) Detailed description of the problem, 2) Steps to reproduce it, 3) Screenshots/videos if possible, 4) Your Minecraft version, 5) When it happened. For game-breaking bugs, contact staff immediately. We appreciate detailed bug reports - they help us fix issues faster!",
        keywords: ["bug", "report", "issue", "problem", "glitch", "error"],
    },
    {
        id: "discord-link",
        category: "technical",
        question: "Where can I join the Discord server?",
        answer: "Our Discord server is the hub of the community! You can find the invite link on our website footer, in-game, or by asking any staff member. Discord is where we announce events, share updates, provide support, host discussions, and build community. It's highly recommended to join if you're an active player!",
        keywords: ["discord", "link", "invite", "community", "chat"],
    },
];

export default function FAQPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");

    // Filter FAQs based on search and category
    const filteredFAQs = useMemo(() => {
        let results = faqs;

        // Filter by category
        if (selectedCategory !== "all") {
            results = results.filter(faq => faq.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            results = results.filter(faq => 
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query) ||
                faq.keywords.some(keyword => keyword.includes(query))
            );
        }

        return results;
    }, [searchQuery, selectedCategory]);

    // Group FAQs by category for display
    const groupedFAQs = useMemo(() => {
        const groups = new Map<CategoryId, FAQItem[]>();
        
        filteredFAQs.forEach(faq => {
            const existing = groups.get(faq.category) || [];
            groups.set(faq.category, [...existing, faq]);
        });

        return groups;
    }, [filteredFAQs]);

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
                {/* Breadcrumb */}
                <Breadcrumb items={[{ label: "FAQ" }]} />

                {/* Header */}
                <header className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                        <HelpCircle className="w-8 h-8 text-white" aria-hidden="true" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Find answers to common questions about Imaginears Club
                    </p>
                </header>

                {/* Search and Filters */}
                <div className={cn(
                    "rounded-2xl border-2 p-6 mb-8 shadow-sm",
                    "border-slate-300 dark:border-slate-700",
                    "bg-white dark:bg-slate-900"
                )}>
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <Input
                            type="search"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11"
                            aria-label="Search FAQ"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={cn(
                                "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                                selectedCategory === "all"
                                    ? "bg-blue-500 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                        >
                            All ({faqs.length})
                        </button>
                        {categories.map(cat => {
                            const count = faqs.filter(f => f.category === cat.id).length;
                            const Icon = cat.icon;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 inline-flex items-center gap-2",
                                        selectedCategory === cat.id
                                            ? "bg-blue-500 text-white shadow-md"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4" aria-hidden="true" />
                                    {cat.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Results Count */}
                {(searchQuery || selectedCategory !== "all") && (
                    <div className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                        Showing <strong className="text-slate-900 dark:text-white">{filteredFAQs.length}</strong> {filteredFAQs.length === 1 ? 'result' : 'results'}
                    </div>
                )}

                {/* FAQ Groups */}
                {filteredFAQs.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No results found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            Try adjusting your search or filters
                        </p>
                    </div>
                ) : (
                    <>
                        {categories.map(cat => {
                            const categoryFAQs = groupedFAQs.get(cat.id);
                            if (!categoryFAQs || categoryFAQs.length === 0) return null;

                            const Icon = cat.icon;

                            return (
                                <section key={cat.id} className="mb-8">
                                    {/* Category Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-xl",
                                            "bg-slate-100 dark:bg-slate-800"
                                        )}>
                                            <Icon className={cn("w-5 h-5", cat.color)} aria-hidden="true" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {cat.label}
                                        </h2>
                                        <Badge variant="default" size="sm">
                                            {categoryFAQs.length}
                                        </Badge>
                                    </div>

                                    {/* FAQ Accordion */}
                                    <Accordion type="single" collapsible className="space-y-3">
                                        {categoryFAQs.map(faq => (
                                            <AccordionItem
                                                key={faq.id}
                                                value={faq.id}
                                                className={cn(
                                                    "rounded-xl border-2 px-6 transition-all duration-200",
                                                    "border-slate-300 dark:border-slate-700",
                                                    "bg-white dark:bg-slate-900",
                                                    "hover:border-slate-400 dark:hover:border-slate-600"
                                                )}
                                            >
                                                <AccordionTrigger className="text-left hover:no-underline py-5">
                                                    <span className="font-semibold text-slate-900 dark:text-white pr-4">
                                                        {faq.question}
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-slate-700 dark:text-slate-300 pb-5 leading-relaxed">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </section>
                            );
                        })}
                    </>
                )}

                {/* Still have questions? */}
                <div className={cn(
                    "mt-12 rounded-2xl border-2 p-8 text-center",
                    "border-slate-300 dark:border-slate-700",
                    "bg-slate-50 dark:bg-slate-900/50"
                )}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Still have questions?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Join our Discord server or reach out to our staff team for help!
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href="https://imaginears.club/d"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                "px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md",
                                "bg-[#5865F2] hover:bg-[#4752C4] hover:shadow-lg",
                                "!text-white"
                            )}
                        >
                            Join Discord
                        </a>
                        <a
                            href="/apply"
                            className={cn(
                                "px-6 py-3 rounded-lg font-semibold transition-all duration-200",
                                "bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
                                "border-2 border-slate-300 dark:border-slate-700",
                                "hover:border-slate-400 dark:hover:border-slate-600"
                            )}
                        >
                            Apply Now
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

