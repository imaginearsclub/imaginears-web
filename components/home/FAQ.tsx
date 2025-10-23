import { memo, useMemo } from "react";
import Link from "next/link";

// Security: Freeze FAQ data at build time
const FAQS = Object.freeze([
    {
        id: "disney-affiliation",
        question: "Is this affiliated with Disney?",
        answer: "No, we are not. However, while we are not affiliated with The Walt Disney Company. We are a community of fans who love the Disney theme parks and want to create a fun and engaging experience for everyone.",
        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "mods-required",
        question: "Do I need mods to join?",
        answer: "Mods are not required; resource packs are delivered in-game when needed. However, we do recommend using Optifine and Smooth Coasters for the best experience.",
        icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "kid-friendly",
        question: "Is it kid-friendly?",
        answer: "We are family-friendly; as we have guests that are of all ages. We want our server to be fun and exciting for all ages. So we request that you be respectful of others and follow our community rules.",
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        color: "from-green-500 to-emerald-500"
    }
] as const);

// Performance: Memoized FAQ card component
const FAQCard = memo(({ faq }: { faq: typeof FAQS[number] }) => (
    <article className="group relative card card-glass overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
        {/* Gradient accent at top */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${faq.color}`} />
        
        {/* Icon and content */}
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${faq.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-md`}>
                    <svg 
                        className="w-5 h-5 text-white"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={faq.icon} />
                    </svg>
                </div>
                
                <h3 className="flex-1 text-lg font-bold text-body group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 dark:group-hover:from-blue-400 dark:group-hover:to-purple-400 transition-all duration-300">
                    {faq.question}
                </h3>
            </div>
            
            <p className="text-body leading-relaxed">
                {faq.answer}
            </p>
        </div>

        {/* Decorative corner element */}
        <div className={`absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-br ${faq.color} opacity-5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:opacity-10`} aria-hidden="true" />
    </article>
));

FAQCard.displayName = 'FAQCard';

function FAQ() {
    // Performance: Memoize FAQ data
    const faqs = useMemo(() => FAQS, []);

    return (
        <section className="band-alt" aria-labelledby="faq-heading">
            <div className="container py-12 md:py-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h2 id="faq-heading" className="section-title text-3xl md:text-4xl font-extrabold text-body">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-2 text-body max-w-2xl">
                            Quick answers to common questions about our Minecraft server
                        </p>
                    </div>
                    
                    {/* Future: Link to full FAQ page - currently placeholder */}
                    <Link 
                        href="/faq"
                        className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        View all FAQs
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {faqs.map((faq) => (
                        <FAQCard key={faq.id} faq={faq} />
                    ))}
                </div>

                {/* Call to action for more help */}
                <div className="mt-12 text-center">
                    <p className="text-body mb-4">
                        Still have questions?
                    </p>
                    <a
                        href="https://imaginears.club/d"
                        target="_blank"
                        rel="noopener noreferrer"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span className="flex items-center gap-2 text-white">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                            </svg>
                            Ask on Discord
                        </span>
                    </a>
                </div>
            </div>
        </section>
    );
}

export default memo(FAQ);
