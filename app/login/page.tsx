"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAuthClient } from "better-auth/client";
import { Input, Alert, Spinner, Separator, Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { LogIn, Mail, Lock, Shield } from "lucide-react";
import { TwoFactorVerification } from "@/app/login/components/TwoFactorVerification";

const auth = createAuthClient(
    process.env['NEXT_PUBLIC_SITE_URL'] 
        ? { baseURL: process.env['NEXT_PUBLIC_SITE_URL'] }
        : {}
);

function friendlyError(e: unknown): string {
    if (!e) return "Unknown error";
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message;
    try {
        const any = e as any;
        if (typeof any?.message === "string") return any.message;
        if (typeof any?.error?.message === "string") return any.error.message;
        return JSON.stringify(any);
    } catch {
        return "Unknown error";
    }
}

// Validation helper
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

export default function LoginPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const callbackUrl = sp.get("callbackUrl") || "/admin/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [touched, setTouched] = useState({ email: false, password: false });
    
    // 2FA state
    const [show2FA, setShow2FA] = useState(false);
    
    // Security: Rate limiting
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
    
    // Validation states
    const emailValid = !touched.email || isValidEmail(email);
    const passwordValid = !touched.password || password.length > 0;
    const formValid = isValidEmail(email) && password.length > 0;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        
        // Mark all fields as touched
        setTouched({ email: true, password: true });
        
        // Security: Client-side validation
        if (!formValid) {
            setErr("Please enter a valid email and password.");
            return;
        }
        
        // Security: Rate limiting (prevent brute force)
        const now = Date.now();
        if (now - lastAttemptTime < 1000) {
            setErr("Please wait a moment before trying again.");
            return;
        }
        
        if (loginAttempts >= 5) {
            setErr("Too many login attempts. Please wait a few minutes and try again.");
            return;
        }
        
        setLastAttemptTime(now);
        setLoginAttempts(prev => prev + 1);
        setLoading(true);
        
        try {
            // Security: Sanitize inputs
            const sanitizedEmail = email.trim().toLowerCase();
            
            const res = await fetch("/api/auth/sign-in/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: sanitizedEmail, 
                    password, // Don't trim - whitespace might be intentional
                    callbackURL: callbackUrl 
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(async () => ({ message: await res.text().catch(() => "") }));
                setErr(friendlyError((data as any)?.message || data));
                return;
            }

            const data = await res.json().catch(() => null);
            if (data && data.redirect && typeof data.url === "string") {
                window.location.href = data.url;
                return;
            }

            router.push(callbackUrl);
        } catch (e2) {
            setErr(friendlyError(e2));
        } finally {
            setLoading(false);
        }
    }
    
    // Handle 2FA verification
    async function handle2FAVerify(code: string): Promise<boolean> {
        try {
            const sanitizedEmail = email.trim().toLowerCase();
            
            const res = await fetch("/api/auth/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: sanitizedEmail,
                    password,
                    code,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ message: "Verification failed" }));
                console.error("[2FA] Verification failed:", data.message);
                return false;
            }

            // Success - redirect to callback URL
            router.push(callbackUrl);
            return true;
        } catch (error) {
            console.error("[2FA] Verification error:", error);
            return false;
        }
    }
    
    // Handle back from 2FA
    function handleBackFrom2FA() {
        setShow2FA(false);
        setLoading(false);
    }

    async function onDiscord() {
        setErr(null);
        setLoading(true);
        try {
            await auth.signIn.social({
                provider: "discord",
                callbackURL: callbackUrl, // ✅ correct prop
            });
            // Will navigate away; no router.push needed
        } catch (e2) {
            setErr(friendlyError(e2));
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl p-8 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl my-12">
            {/* Show 2FA verification if required */}
            {show2FA ? (
                <TwoFactorVerification
                    email={email}
                    onVerify={handle2FAVerify}
                    onBack={handleBackFrom2FA}
                    loading={loading}
                />
            ) : (
                <>
                    {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    "bg-blue-100 dark:bg-blue-900/30"
                )}>
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Login</h1>
                    <Badge variant="primary" size="sm" className="mt-0.5">Secure Access</Badge>
                </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Sign in to access the admin dashboard
            </p>
            
            <Separator className="my-4" />

            {err && (
                <Alert variant="error" className="mb-4" dismissible onDismiss={() => setErr(null)}>
                    {err}
                </Alert>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
                {/* Email Field */}
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setTouched({ ...touched, email: true });
                            }}
                            onBlur={() => setTouched({ ...touched, email: true })}
                            autoComplete="username"
                            disabled={loading}
                            placeholder="admin@example.com"
                            className="pl-10"
                            state={!emailValid ? "error" : "default"}
                        />
                    </div>
                    {touched.email && !emailValid && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Please enter a valid email address</p>
                    )}
                </div>
                
                {/* Password Field */}
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPass(e.target.value);
                                setTouched({ ...touched, password: true });
                            }}
                            onBlur={() => setTouched({ ...touched, password: true })}
                            autoComplete="current-password"
                            disabled={loading}
                            placeholder="••••••••"
                            className="pl-10"
                            state={!passwordValid ? "error" : "default"}
                        />
                    </div>
                    {touched.password && !passwordValid && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Password is required</p>
                    )}
                </div>
                
                {/* Submit Button */}
                <button 
                    type="submit"
                    className={cn(
                        "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                        "bg-blue-600 dark:bg-blue-500",
                        "text-white",
                        "hover:bg-blue-700 dark:hover:bg-blue-600",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "border-2 border-transparent"
                    )}
                    disabled={loading || !formValid}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" variant="current" />
                            Signing in…
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            Sign in
                        </>
                    )}
                </button>
            </form>

            {process.env['NEXT_PUBLIC_ENABLE_DISCORD'] !== "false" && (
                <>
                    <div className="relative my-4">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-2 text-xs text-slate-500 dark:text-slate-400">
                            or
                        </span>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={onDiscord} 
                        disabled={loading}
                        className={cn(
                            "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                            "bg-[#5865F2] hover:bg-[#4752C4]",
                            "text-white",
                            "focus:outline-none focus:ring-2 focus:ring-[#5865F2]/50",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "border-2 border-transparent"
                        )}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        Continue with Discord
                    </button>
                </>
            )}
                </>
            )}
        </div>
    );
}
