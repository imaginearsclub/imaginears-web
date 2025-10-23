"use client";

import { type FormEvent, useState, useCallback, memo } from "react";

// Security: Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum

// Feature flag: Set to true when newsletter system is ready
const NEWSLETTER_ENABLED = process.env['NEXT_PUBLIC_NEWSLETTER_ENABLED'] === "true";

// Performance: Memoized status message component
const StatusMessage = memo(({ status }: { status: "idle" | "ok" | "err" | "loading" }) => {
    if (status === "ok") {
        return (
            <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">Success!</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Thanks for subscribing! Check your inbox to confirm your subscription.
                    </p>
                </div>
            </div>
        );
    }

    if (status === "err") {
        return (
            <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">Invalid Email</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Please enter a valid email address.
                    </p>
                </div>
            </div>
        );
    }

    return null;
});

StatusMessage.displayName = 'StatusMessage';

function Newsletter() {
    const [status, setStatus] = useState<"idle" | "ok" | "err" | "loading">("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Performance & Security: Memoized submit handler with validation
    const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Security: Prevent double submission
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setStatus("loading");
        
        try {
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") || "").trim();

            // Security: Enhanced email validation
            if (!email) {
                setStatus("err");
                return;
            }

            if (email.length > MAX_EMAIL_LENGTH) {
                setStatus("err");
                return;
            }

            if (!EMAIL_REGEX.test(email)) {
                setStatus("err");
                return;
            }

            // TODO: POST to your newsletter provider or API
            // Example:
            // const sanitizedEmail = email.replace(/[<>]/g, ''); // Security: Sanitize email
            // const response = await fetch('/api/newsletter', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email: sanitizedEmail }),
            // });
            // if (!response.ok) throw new Error('Subscription failed');

            // Simulate API delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setStatus("ok");
            e.currentTarget.reset();
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus("err");
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting]);

    // Feature flag: Don't render if newsletter is disabled
    if (!NEWSLETTER_ENABLED) {
        return null;
    }

    return (
        <section className="band-alt" aria-labelledby="newsletter-heading">
            <div className="container py-12 md:py-16">
                <div className="card card-glass max-w-3xl mx-auto">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h2 id="newsletter-heading" className="text-2xl md:text-3xl font-bold text-body dark:text-white">
                                Stay Updated
                            </h2>
                            <p className="mt-2 text-body leading-relaxed">
                                Get notified about new shows, special events, and seasonal overlays—delivered straight to your inbox.
                            </p>
                        </div>
                    </div>
                    
                    <form onSubmit={onSubmit} className="mt-6" noValidate>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                                <input
                                    id="newsletter-email"
                                    type="email"
                                    name="email"
                                    required
                                    maxLength={MAX_EMAIL_LENGTH}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                    className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-600
                                             bg-white dark:bg-slate-900 px-4 py-3 
                                             text-slate-900 dark:text-white
                                             placeholder:text-slate-400 dark:placeholder:text-slate-500
                                             outline-none transition-all duration-200
                                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             hover:border-slate-400 dark:hover:border-slate-500"
                                    aria-describedby={status === "err" ? "newsletter-error" : undefined}
                                    aria-invalid={status === "err"}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="btn-gradient shrink-0 disabled:opacity-50 disabled:cursor-not-allowed
                                         flex items-center justify-center gap-2 min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Subscribing...</span>
                                    </>
                                ) : (
                                    <>
                                        Subscribe
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* Privacy notice */}
                        <p className="mt-3 text-xs text-body text-sln-600 dark:text-sln-400">
                            We respect your privacy. Unsubscribe at any time.
                        </p>
                    </form>

                    {/* Status messages */}
                    <StatusMessage status={status} />
                </div>
            </div>
        </section>
    );
}

export default memo(Newsletter);
