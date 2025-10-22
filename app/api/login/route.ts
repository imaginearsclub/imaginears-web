import { NextResponse } from "next/server";

// This legacy route is deprecated in favor of Better-Auth.
// Proxy the request to Better-Auth's credentials endpoint so
// there is a single source of truth for password verification
// (Account.password). User.passwordHash is no longer used.
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const origin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const url = new URL("/api/auth/sign-in/email", origin);
        const res = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const text = await res.text();
        // Forward status and content-type
        return new NextResponse(text, {
            status: res.status,
            headers: { "content-type": res.headers.get("content-type") || "application/json" },
        });
    } catch (e) {
        console.error("legacy /api/login proxy error", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
