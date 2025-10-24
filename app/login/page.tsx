"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAuthClient } from "better-auth/client";
import { Input, Alert, Spinner } from "@/components/common";

const auth = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

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

export default function LoginPage() {
    const router = useRouter();
    const sp = useSearchParams();
    const callbackUrl = sp.get("callbackUrl") || "/admin/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const res = await fetch("/api/auth/sign-in/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, callbackURL: callbackUrl }),
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
        <div className="mx-auto max-w-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mt-10">
            <h1 className="text-xl font-bold">Admin Login</h1>

            {err && (
                <Alert variant="error" className="mt-3" dismissible onDismiss={() => setErr(null)}>
                    {err}
                </Alert>
            )}

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <div>
                    <label className="text-sm font-medium block mb-1">Email</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                        disabled={loading}
                        placeholder="admin@example.com"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">Password</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPass(e.target.value)}
                        autoComplete="current-password"
                        disabled={loading}
                        placeholder="••••••••"
                    />
                </div>
                <button className="btn btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
                    {loading && <Spinner size="sm" variant="current" />}
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>

            {process.env.NEXT_PUBLIC_ENABLE_DISCORD !== "false" && (
                <button className="btn btn-ghost w-full mt-3" onClick={onDiscord} disabled={loading}>
                    Continue with Discord
                </button>
            )}
        </div>
    );
}
