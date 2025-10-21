"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/client";

const auth = createAuthClient({
    // If your app isn’t running at http://localhost:3000, set NEXT_PUBLIC_SITE_URL
    // and pass it here so the client knows where /api/auth lives.
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

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

export default function RegisterPage() {
    const [email, setE] = useState("");
    const [password, setP] = useState("");
    const [name, setN] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const router = useRouter();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            // 1) sign up with email/password
            const res = await auth.signUp.email({
                email,
                password,
                name: name || email.split("@")[0],
                // If you configured email verification, add: redirectTo: "/login"
            });

            if (!res?.ok) {
                setErr(friendlyError(res));
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
        <div className="mx-auto max-w-sm p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mt-10">
            <h1 className="text-xl font-bold">Create First Admin</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Temporary page to create your initial owner/admin. Delete after use.
            </p>

            {err && (
                <div className="mt-3 rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">
                    {err}
                </div>
            )}

            <form className="mt-4 space-y-3" onSubmit={onSubmit}>
                <div>
                    <label className="text-sm font-medium">Name</label>
                    <input className="w-full mt-1 rounded-2xl border px-4 py-3"
                           value={name} onChange={(e)=>setN(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium">Email</label>
                    <input className="w-full mt-1 rounded-2xl border px-4 py-3"
                           value={email} onChange={(e)=>setE(e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium">Password</label>
                    <input type="password" className="w-full mt-1 rounded-2xl border px-4 py-3"
                           value={password} onChange={(e)=>setP(e.target.value)} />
                </div>
                <button className="btn btn-primary w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create admin"}
                </button>
            </form>

            <p className="text-xs text-slate-500 mt-3">
                Tip: remove this page after your first admin is created.
            </p>
        </div>
    );
}
