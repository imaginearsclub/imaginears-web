import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Note: Middleware runs on the Edge runtime. Do not import database/auth code here.

export async function middleware(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Always allow preflight requests
    if (req.method === "OPTIONS") return NextResponse.next();

    if (pathname.startsWith("/admin")) {
        // Lightweight session presence check using cookies only.
        // This avoids importing Prisma/Better-Auth into the Edge runtime.
        const cookies = req.cookies.getAll();
        const hasLikelySession = cookies.some((c) => /session/i.test(c.name) && /auth|better|next/i.test(c.name));

        if (!hasLikelySession) {
            return redirectToLogin(req, pathname, searchParams);
        }

        // We intentionally skip role checks in middleware (Edge). Perform fine-grained
        // authorization inside Node.js runtime (server components/route handlers).
        const res = NextResponse.next();
        hardenHeaders(res, req);
        return res;
    }

    return NextResponse.next();
}

function redirectToLogin(req: NextRequest, pathname: string, searchParams: URLSearchParams) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";

    // Build a safe, relative callback URL (avoid open redirects)
    const callbackPath = pathname + (searchParams.size ? `?${searchParams}` : "");
    const safeCallback = callbackPath.startsWith("/") ? callbackPath : "/";
    // Hard limit callback length to avoid abuse
    const limited = safeCallback.slice(0, 2048);
    url.searchParams.set("callbackUrl", limited);

    return NextResponse.redirect(url);
}

function hardenHeaders(res: NextResponse, req: NextRequest) {
    // Do not cache authenticated admin responses
    res.headers.set("Cache-Control", "no-store, private");

    // Basic hardening headers (safe defaults)
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "same-origin");
    res.headers.set("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), microphone=(), gyroscope=(), interest-cohort=()");

    // Only set HSTS when we know the request is HTTPS (avoid localhost issues)
    const proto = req.headers.get("x-forwarded-proto") ?? (req.nextUrl.protocol?.replace(":", "") || "");
    if (proto === "https") {
        // 6 months, include subdomains, preload signal
        res.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
    }
}

export const config = { matcher: ["/admin/:path*"] };
