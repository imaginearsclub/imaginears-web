"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Alert, Spinner, Separator, Badge } from "@/components/common";
import { cn } from "@/lib/utils";
import { Shield, Mail, Lock, User } from "lucide-react";

function friendlyError(e: unknown): string {
    if (!e) return "Unknown error";
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message;
    try {
        // better-auth often returns { error: { message: string, code?: string } }
        const any = e as any;
        if (typeof any.message === "string") return any.message;
        if (typeof any.error === "string") return any.error;
        if (typeof any.error?.message === "string") return any.error.message;
        return JSON.stringify(any);
    } catch {
        return "Unknown error";
    }
}

// Validation helpers
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function getPasswordStrength(password: string): { strength: number; label: string; variant: "danger" | "warning" | "success" } {
    if (password.length === 0) return { strength: 0, label: "", variant: "danger" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: "Weak", variant: "danger" };
    if (strength <= 3) return { strength, label: "Medium", variant: "warning" };
    return { strength, label: "Strong", variant: "success" };
}

export default function RegisterPage() {
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [name, setN] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [touched, setTouched] = useState({ email: false, password: false, name: false });
    const router = useRouter();
    
    // Security: Prevent multiple submissions
    const [submitAttempts, setSubmitAttempts] = useState(0);
    const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
    
    // Validation states
    const emailValid = !touched.email || isValidEmail(email);
    const passwordStrength = getPasswordStrength(password);
    const passwordValid = !touched.password || password.length >= 8;
    const formValid = isValidEmail(email) && password.length >= 8 && name.trim().length > 0;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        
        // Mark all fields as touched for validation
        setTouched({ email: true, password: true, name: true });
        
        // Security: Client-side validation
        if (!formValid) {
            setErr("Please fill in all fields correctly.");
            return;
        }
        
        // Security: Rate limiting (prevent spam)
        const now = Date.now();
        if (now - lastSubmitTime < 2000) {
            setErr("Please wait a moment before trying again.");
            return;
        }
        
        if (submitAttempts >= 5) {
            setErr("Too many attempts. Please refresh the page and try again.");
            return;
        }
        
        setLastSubmitTime(now);
        setSubmitAttempts(prev => prev + 1);
        setLoading(true);

        try {
            // Security: Sanitize inputs before sending
            const sanitizedEmail = email.trim().toLowerCase();
            const sanitizedName = name.trim() || email.split("@")[0];
            
            // 1) Sign up with Better-Auth via REST to ensure credentials account is created
            const res = await fetch("/api/auth/sign-up/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: sanitizedEmail,
                    password, // Don't trim passwords - whitespace might be intentional
                    name: sanitizedName,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(async () => ({ message: await res.text().catch(() => "") }));
                setErr(friendlyError(data?.message || data));
                setLoading(false);
                return;
            }

            // 2) bootstrap org & owner role
            const r = await fetch("/api/dev/bootstrap-admin", { method: "POST" });
            if (!r.ok) {
                const txt = await r.text().catch(() => "");
                setErr(txt || `Bootstrap failed (HTTP ${r.status})`);
                setLoading(false);
                return;
            }

            router.push("/admin/dashboard");
        } catch (e2) {
            console.error("Sign up error:", e2);
            setErr(friendlyError(e2));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-md p-6 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl mt-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    "bg-blue-100 dark:bg-blue-900/30"
                )}>
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create First Admin</h1>
                    <Badge variant="warning" size="sm" className="mt-0.5">Temporary Setup</Badge>
                </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Create your initial admin account. <strong>Remove this page after setup.</strong>
            </p>
            
            <Separator className="my-4" />

            {err && (
                <Alert variant="error" className="mb-4" dismissible onDismiss={() => setErr(null)}>
                    {err}
                </Alert>
            )}

            <form className="space-y-4" onSubmit={onSubmit}>
                {/* Name Field */}
                <div>
                    <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                        Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <Input
                            value={name}
                            onChange={(e) => {
                                setN(e.target.value);
                                setTouched({ ...touched, name: true });
                            }}
                            onBlur={() => setTouched({ ...touched, name: true })}
                            disabled={loading}
                            placeholder="Admin Name"
                            className="pl-10"
                            state={touched.name && name.trim().length === 0 ? "error" : "default"}
                        />
                    </div>
                    {touched.name && name.trim().length === 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Name is required</p>
                    )}
                </div>
                
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
                                setE(e.target.value);
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
                                setP(e.target.value);
                                setTouched({ ...touched, password: true });
                            }}
                            onBlur={() => setTouched({ ...touched, password: true })}
                            autoComplete="new-password"
                            disabled={loading}
                            placeholder="••••••••"
                            className="pl-10"
                            state={!passwordValid ? "error" : "default"}
                        />
                    </div>
                    {touched.password && !passwordValid && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Password must be at least 8 characters</p>
                    )}
                    {password.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                    className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        passwordStrength.variant === "danger" && "bg-red-500 w-1/3",
                                        passwordStrength.variant === "warning" && "bg-amber-500 w-2/3",
                                        passwordStrength.variant === "success" && "bg-emerald-500 w-full"
                                    )}
                                />
                            </div>
                            <Badge variant={passwordStrength.variant} size="sm">
                                {passwordStrength.label}
                            </Badge>
                        </div>
                    )}
                </div>
                
                <Separator />
                
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
                    {loading && <Spinner size="sm" variant="current" />}
                    {loading ? "Creating Account…" : "Create Admin Account"}
                </button>
            </form>

            <Separator className="my-4" />
            
            <Alert variant="warning" className="mt-4">
                <strong>Security Notice:</strong> Remove or protect this registration page after creating your first admin account.
            </Alert>
        </div>
    );
}
