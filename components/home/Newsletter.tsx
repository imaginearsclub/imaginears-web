"use client";

import {type FormEvent, useState } from "react";

export default function Newsletter() {
    const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const email = String(fd.get("email") || "").trim();

        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            setStatus("err");
            return;
        }

        // TODO: POST to your newsletter provider or API
        setStatus("ok");
        e.currentTarget.reset();
    };

    return (
        <section>
            <div className="container py-12 md:py-16">
                <div className="card card-glass">
                    <h2 className="section-title text-2xl md:text-3xl font-bold">Get park updates</h2>
                    <p className="mt-2 text-body">
                        New shows, special events, and seasonal overlays—straight to your inbox.
                    </p>
                    <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 text-body">
                        <input
                            type="email"
                            name="email"
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700
                         bg-white dark:bg-slate-900 px-4 py-3 outline-none
                         focus:ring-2 focus:ring-brandStart/50"
                        />
                        <button type="submit" className="btn-gradient">Subscribe</button>
                    </form>
                    {status === "ok" && (
                        <p className="mt-3 text-sm text-green-600 dark:text-green-400">
                            Thanks! Check your inbox to confirm.
                        </p>
                    )}
                    {status === "err" && (
                        <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                            Please enter a valid email address.
                        </p>
                    )}
                </div>
            </div>
        </section>
    );
}
