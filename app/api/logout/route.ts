import { headers as nextHeaders } from "next/headers";

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

        // Return the upstream response directly to propagate Set-Cookie headers
        return res;
    } catch (e) {
        return new Response(JSON.stringify({ ok: false }), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
        });
    }
}
