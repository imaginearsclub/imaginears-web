import { memo, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Settings, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Security: Sanitize FAQ text
const MAX_QUESTION_LENGTH = 200;
const MAX_ANSWER_LENGTH = 500;

function sanitizeText(text: string, maxLength: number): string {
    return text.slice(0, maxLength).trim();
}

// Security & Performance: Freeze FAQ data at build time
const FAQS = Object.freeze([
    {
        id: "disney-affiliation",
        question: "Is this affiliated with Disney?",
        answer: "No, we are not. However, while we are not affiliated with The Walt Disney Company. We are a community of fans who love the Disney theme parks and want to create a fun and engaging experience for everyone.",
        Icon: BookOpen,
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        id: "mods-required",
        question: "Do I need mods to join?",
        answer: "Mods are not required; resource packs are delivered in-game when needed. However, we do recommend using Optifine and Smooth Coasters for the best experience.",
        Icon: Settings,
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
        id: "kid-friendly",
        question: "Is it kid-friendly?",
        answer: "We are family-friendly; as we have guests that are of all ages. We want our server to be fun and exciting for all ages. So we request that you be respectful of others and follow our community rules.",
        Icon: ShieldCheck,
        gradient: "from-green-500 to-emerald-500",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        iconColor: "text-green-600 dark:text-green-400"
    }
] as const);

// Performance: Memoized FAQ card component
const FAQCard = memo(({ faq }: { faq: typeof FAQS[number] }) => {
    const safeQuestion = sanitizeText(faq.question, MAX_QUESTION_LENGTH);
    const safeAnswer = sanitizeText(faq.answer, MAX_ANSWER_LENGTH);
    const Icon = faq.Icon;

    return (
        <article className={cn(
            "group relative overflow-hidden transition-all duration-300",
            "rounded-2xl border-2 p-6",
            "bg-white dark:bg-slate-900",
            "border-slate-300 dark:border-slate-700",
            "shadow-lg hover:shadow-2xl hover:-translate-y-1",
            "hover:border-slate-400 dark:hover:border-slate-600"
        )}>
            {/* Gradient accent at top */}
            <div className={cn(
                "absolute top-0 left-0 right-0 h-1",
                `bg-gradient-to-r ${faq.gradient}`
            )} />
            
            {/* Icon and content */}
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md",
                        faq.bgColor,
                        "group-hover:scale-110 group-hover:rotate-3"
                    )}>
                        <Icon 
                            className={cn("w-6 h-6", faq.iconColor)}
                            aria-hidden="true"
                        />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className={cn(
                            "text-lg font-bold leading-snug transition-all duration-300",
                            "text-slate-900 dark:text-white",
                            "group-hover:text-transparent group-hover:bg-clip-text",
                            "group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600",
                            "dark:group-hover:from-blue-400 dark:group-hover:to-purple-400"
                        )}>
                            {safeQuestion}
                        </h3>
                    </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {safeAnswer}
                </p>
            </div>

            {/* Decorative corner element */}
            <div 
                className={cn(
                    "absolute -bottom-8 -right-8 w-24 h-24 rounded-full transition-all duration-300",
                    `bg-gradient-to-br ${faq.gradient}`,
                    "opacity-5 group-hover:scale-150 group-hover:opacity-10"
                )}
                aria-hidden="true" 
            />
        </article>
    );
});

FAQCard.displayName = 'FAQCard';

function FAQ() {
    // Performance: Memoize FAQ data
    const faqs = useMemo(() => FAQS, []);

    return (
        <section className="band-alt" aria-labelledby="faq-heading">
            <div className="container py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h2 id="faq-heading" className={cn(
                            "text-3xl md:text-4xl font-extrabold",
                            "text-slate-900 dark:text-white"
                        )}>
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-2 text-slate-700 dark:text-slate-300 max-w-2xl">
                            Quick answers to common questions about our Minecraft server
                        </p>
                    </div>
                    
                    {/* Future: Link to full FAQ page - currently placeholder */}
                    <Link 
                        href="/faq"
                        className={cn(
                            "group inline-flex items-center gap-2 text-sm font-semibold transition-colors",
                            "text-blue-600 dark:text-blue-400",
                            "hover:text-blue-700 dark:hover:text-blue-300"
                        )}
                    >
                        View all FAQs
                        <ArrowRight 
                            className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                            aria-hidden="true" 
                        />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {faqs.map((faq) => (
                        <FAQCard key={faq.id} faq={faq} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default memo(FAQ);
