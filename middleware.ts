import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Note: Middleware runs on the Edge runtime. Do not import database/auth code here.

export async function middleware(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    // Always allow preflight requests
    if (req.method === "OPTIONS") return NextResponse.next();

    // Check maintenance mode (skip for admin, API routes, and maintenance page itself)
    const isPublicRoute = !pathname.startsWith("/admin") && !pathname.startsWith("/api");
    const isMaintenancePage = pathname === "/maintenance";
    
    if (isPublicRoute && !isMaintenancePage) {
        try {
            const origin = req.nextUrl.origin;
            const maintenanceCheckUrl = `${origin}/api/maintenance-check`;
            
            const maintenanceCheck = await fetch(maintenanceCheckUrl, {
                headers: {
                    "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
                    "x-real-ip": req.headers.get("x-real-ip") ?? "",
                },
                cache: "no-store",
            });

            if (maintenanceCheck.ok) {
                const data = await maintenanceCheck.json();
                if (data.maintenance) {
                    // Redirect to maintenance page
                    const url = req.nextUrl.clone();
                    url.pathname = "/maintenance";
                    return NextResponse.redirect(url);
                }
            }
        } catch (error) {
            // On error, allow access (fail open for maintenance checks)
            console.error("[Middleware] Maintenance check error:", error);
        }
    }

    if (pathname.startsWith("/admin")) {
        // Session validation using Better-Auth session check
        // We validate the session server-side to ensure it's not expired/invalid
        const cookies = req.cookies.getAll();
        const hasSessionCookie = cookies.some((c) => 
            (c.name.includes("session") || c.name.includes("better-auth")) && c.value
        );

        // If no session cookie at all, redirect immediately
        if (!hasSessionCookie) {
            return redirectToLogin(req, pathname, searchParams);
        }

        // Validate the session by calling Better-Auth
        // This ensures the session is actually valid, not just present
        try {
            const origin = req.nextUrl.origin;
            const sessionCheckUrl = `${origin}/api/auth/session-check`;
            
            const sessionCheck = await fetch(sessionCheckUrl, {
                headers: {
                    cookie: req.headers.get("cookie") ?? "",
                },
                cache: "no-store",
            });

            // If session is invalid, redirect to login
            if (!sessionCheck.ok) {
                return redirectToLogin(req, pathname, searchParams);
            }
        } catch (error) {
            // On error, fail closed and redirect to login
            console.error("[Middleware] Session validation error:", error);
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

    // Enhanced hardening headers
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "accelerometer=(), camera=(), geolocation=(), microphone=(), gyroscope=(), interest-cohort=()");
    
    // Add CSRF protection header
    res.headers.set("X-CSRF-Token", "required");

    // Only set HSTS when we know the request is HTTPS (avoid localhost issues)
    const proto = req.headers.get("x-forwarded-proto") ?? (req.nextUrl.protocol?.replace(":", "") || "");
    if (proto === "https") {
        // 1 year, include subdomains, preload signal
        res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
}

export const config = { 
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public assets
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ]
};
