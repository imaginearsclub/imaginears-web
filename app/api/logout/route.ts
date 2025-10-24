import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

// Proxy to Better-Auth sign-out so it clears the auth cookies correctly.
export async function POST() {
    try {
        const h = await nextHeaders();
        const host = h.get("x-forwarded-host") ?? h.get("host");
        const proto = h.get("x-forwarded-proto") ?? "http";
        if (!host) {
            return new Response(JSON.stringify({ ok: false, error: "Missing host header" }), {
                status: 500,
                headers: { "content-type": "application/json; charset=utf-8" },
            });
        }

        const base = `${proto}://${host}`;

        // Forward the POST with cookies so Better-Auth can invalidate the session
        const res = await fetch(`${base}/api/auth/sign-out`, {
            method: "POST",
            headers: { cookie: h.get("cookie") ?? "" },
            cache: "no-store",
        });

        // Get the response data and headers
        const data = await res.json().catch(() => ({ ok: true }));
        const headers = new Headers(res.headers);
        
        // Explicitly clear all auth-related cookies with proper flags
        // This ensures cookies are cleared even if Better-Auth doesn't do it properly
        const cookiesToClear = [
            "better-auth.session_token",
            "better-auth.session",
            "__Secure-better-auth.session_token",
            "__Host-better-auth.session_token",
            "next-auth.session-token",
            "better-auth.csrf_token",
        ];
        
        const isSecure = proto === "https";
        for (const cookieName of cookiesToClear) {
            headers.append(
                "Set-Cookie",
                `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}`
            );
        }
        
        // Add cache control headers
        headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
        headers.set("Pragma", "no-cache");
        
        return NextResponse.json(data, {
            status: res.status,
            headers,
        });
    } catch (e) {
        console.error("[Logout] Error:", e);
        return new Response(JSON.stringify({ ok: false, error: "Logout failed" }), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
        });
    }
}
