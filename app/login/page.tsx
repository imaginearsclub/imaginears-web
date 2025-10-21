"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAuthClient } from "better-auth/client";

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
            const res = await auth.signIn.email({ email, password });

            // Type-safe narrowing: Better-Auth returns { error } on failure, { data } on success
            if ("error" in res && res.error) {
                setErr(friendlyError(res.error));
                return;
            }

            // Success case
            const data = (res as typeof res & { data: any }).data;
            // Some providers can request a full redirect
            if (data?.redirect && typeof data?.url === "string") {
                window.location.href = data.url;
                return;
            }

            // Credentials flow: just go to the callback
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
                <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">
                    {err}
                </div>
            )}

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                        className="w-full mt-1 rounded-2xl border px-4 py-3"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Password</label>
                    <input
                        type="password"
                        className="w-full mt-1 rounded-2xl border px-4 py-3"
                        value={password}
                        onChange={(e) => setPass(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                <button className="btn btn-primary w-full" disabled={loading}>
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
