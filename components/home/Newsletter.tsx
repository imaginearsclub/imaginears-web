"use client";

import { type FormEvent, useState, useCallback, memo } from "react";
import { Input, Alert, Spinner, Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

// Security: Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 maximum

// Feature flag: Set to true when newsletter system is ready
const NEWSLETTER_ENABLED = process.env['NEXT_PUBLIC_NEWSLETTER_ENABLED'] === "true";

// Security: Sanitize email to prevent XSS
function sanitizeEmail(email: string): string {
    return email
        .trim()
        .toLowerCase()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, MAX_EMAIL_LENGTH);
}

// Performance: Memoized status message component using Alert
const StatusMessage = memo(({ status }: { status: "idle" | "ok" | "err" | "loading" }) => {
    if (status === "ok") {
        return (
            <Alert variant="success" className="mt-4">
                <CheckCircle className="w-5 h-5" />
                <div>
                    <p className="font-semibold">Success!</p>
                    <p className="mt-1">
                        Thanks for subscribing! Check your inbox to confirm your subscription.
                    </p>
                </div>
            </Alert>
        );
    }

    if (status === "err") {
        return (
            <Alert variant="error" className="mt-4">
                <AlertCircle className="w-5 h-5" />
                <div>
                    <p className="font-semibold">Invalid Email</p>
                    <p className="mt-1">
                        Please enter a valid email address.
                    </p>
                </div>
            </Alert>
        );
    }

    return null;
});

StatusMessage.displayName = 'StatusMessage';

function Newsletter() {
    const [status, setStatus] = useState<"idle" | "ok" | "err" | "loading">("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    // Performance & Security: Memoized submit handler with validation and rate limiting
    const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Security: Prevent double submission
        if (isSubmitting) return;
        
        // Security: Rate limiting (prevent spam)
        const now = Date.now();
        if (now - lastSubmitTime < 3000) { // 3 seconds between submissions
            setStatus("err");
            return;
        }
        
        setLastSubmitTime(now);
        setIsSubmitting(true);
        setStatus("loading");
        
        try {
            const fd = new FormData(e.currentTarget);
            const rawEmail = String(fd.get("email") || "");
            
            // Security: Sanitize email
            const email = sanitizeEmail(rawEmail);

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
            // const response = await fetch('/api/newsletter', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email }),
            // });
            // if (!response.ok) throw new Error('Subscription failed');

            // Simulate API delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setStatus("ok");
            e.currentTarget.reset();
        } catch (error) {
            console.error('[Newsletter] Subscription error:', error);
            setStatus("err");
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, lastSubmitTime]);

    // Feature flag: Don't render if newsletter is disabled
    if (!NEWSLETTER_ENABLED) {
        return null;
    }

    return (
        <section className="band-alt" aria-labelledby="newsletter-heading">
            <div className="container py-12 md:py-16">
                <div className={cn(
                    "card card-glass max-w-3xl mx-auto",
                    "p-6 md:p-8"
                )}>
                    <div className="flex items-start gap-4">
                        {/* Icon with Lucide */}
                        <div className={cn(
                            "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                            "bg-gradient-to-br from-blue-500 to-purple-600"
                        )}>
                            <Mail className="w-6 h-6 text-white" aria-hidden="true" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 
                                    id="newsletter-heading" 
                                    className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white"
                                >
                                    Stay Updated
                                </h2>
                                <Badge variant="primary" size="sm" className="hidden sm:inline-flex">
                                    Free
                                </Badge>
                            </div>
                            <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                                Get notified about new shows, special events, and seasonal overlays—delivered straight to your inbox.
                            </p>
                        </div>
                    </div>
                    
                    <form onSubmit={onSubmit} className="mt-6" noValidate>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                                <Input
                                    id="newsletter-email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    disabled={isSubmitting}
                                    maxLength={MAX_EMAIL_LENGTH}
                                    state={status === "err" ? "error" : "default"}
                                    aria-describedby={status === "err" ? "newsletter-error" : undefined}
                                    aria-invalid={status === "err"}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={cn(
                                    "shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold min-w-[140px]",
                                    "bg-gradient-to-r from-blue-600 to-blue-700",
                                    "hover:from-blue-700 hover:to-blue-800",
                                    "text-white",
                                    "shadow-md hover:shadow-xl hover:-translate-y-0.5",
                                    "transition-all duration-200",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner size="sm" variant="current" label="Subscribing" />
                                        <span>Subscribing...</span>
                                    </>
                                ) : (
                                    <>
                                        Subscribe
                                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* Privacy notice */}
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
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
