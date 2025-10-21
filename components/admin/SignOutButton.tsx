"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const loginPath = useMemo(() => "/login", []);

    const handleClick = useCallback(async () => {
        if (pending) return; // Prevent double-clicks
        setPending(true);

        // Abort any in-flight request before starting a new one
        if (abortRef.current) {
            try { abortRef.current.abort(); } catch {}
        }

        const controller = new AbortController();
        abortRef.current = controller;

        // Safety timeout to avoid hanging forever
        const timeoutId = setTimeout(() => {
            try { controller.abort(); } catch {}
        }, 8000);

        try {
            const res = await fetch("/api/auth/sign-out", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}",
                signal: controller.signal,
                credentials: "include",
            });

            // Whether or not the response is ok, force local redirect to ensure UI resets
            // Better-Auth will clear cookies on success.
            if (!res.ok) {
                // Try to parse error for logging (non-blocking)
                try { await res.text(); } catch {}
            }

            // Use replace so back button won't return to an authed page
            router.replace(loginPath);
        } catch (_err) {
            // Network/abort. Still route to login to ensure user lands on a safe page.
            try { router.replace(loginPath); } catch {}
            // As last resort (router unavailable), hard redirect
            if (typeof window !== "undefined") {
                try { window.location.replace(loginPath); } catch {}
            }
        } finally {
            clearTimeout(timeoutId);
            setPending(false);
        }
    }, [pending, router, loginPath]);

    return (
        <button
            type="button"
            className="btn btn-muted btn-sm"
            onClick={handleClick}
            disabled={pending}
            aria-busy={pending}
        >
            {pending ? "Signing out…" : "Sign out"}
        </button>
    );
}
