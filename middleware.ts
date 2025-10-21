import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Roles that can access the /admin area
const ADMIN_ROLES = new Set(["owner", "admin"]);

export async function middleware(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Always allow preflight requests
    if (req.method === "OPTIONS") return NextResponse.next();

    if (pathname.startsWith("/admin")) {
        try {
            // Read session cookies from the request
            const session = await auth.api.getSession({ headers: req.headers });

            // If no session, redirect to login immediately
            if (!session) {
                return redirectToLogin(req, pathname, searchParams);
            }

            // Determine role from Better-Auth Organization plugin
            const roleRaw = (await auth.api.getActiveMemberRole({ headers: req.headers }))?.data?.role;
            const roles: string[] = Array.isArray(roleRaw) ? roleRaw : roleRaw ? [roleRaw] : [];
            const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));

            if (!isAdmin) {
                return redirectToLogin(req, pathname, searchParams);
            }

            // Add protective headers and no-store for authenticated admin paths
            const res = NextResponse.next();
            hardenHeaders(res, req);
            return res;
        } catch (_e) {
            // Fail closed: if Better-Auth throws or is unreachable, send to login
            return redirectToLogin(req, pathname, searchParams);
        }
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
