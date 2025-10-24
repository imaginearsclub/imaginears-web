import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants for validation
const ALLOWED_PROTOCOLS = ["http", "https"];
const REQUEST_TIMEOUT_MS = 5000; // 5 second timeout
const MAX_HOST_LENGTH = 255; // RFC 1123 max hostname length

// Security: Rate limiting (simple in-memory)
const logoutAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_LOGOUT_ATTEMPTS = 10; // Max 10 logouts per minute per IP

/**
 * Security: Validate and sanitize host header
 * Prevents header injection and SSRF attacks
 */
function validateHost(host: string): boolean {
    if (!host || host.length > MAX_HOST_LENGTH) {
        return false;
    }
    
    // Only allow valid hostname characters
    // Allows: letters, numbers, dots, hyphens, colons (for ports)
    if (!/^[a-zA-Z0-9.-]+(:\d{1,5})?$/.test(host)) {
        return false;
    }
    
    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === "production") {
        const isLocalhost = /^(localhost|127\.|::1|0\.0\.0\.0)/i.test(host);
        const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i.test(host);
        if (isLocalhost || isPrivateIP) {
            return false;
        }
    }
    
    return true;
}

/**
 * Security: Check rate limiting
 * Returns true if rate limit exceeded
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = logoutAttempts.get(identifier);
    
    if (!record || now > record.resetTime) {
        // Reset or create new record
        logoutAttempts.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    
    if (record.count > MAX_LOGOUT_ATTEMPTS) {
        return true;
    }
    
    return false;
}

/**
 * POST /api/logout
 * 
 * Proxy to Better-Auth sign-out endpoint with enhanced security:
 * - Validates and sanitizes host headers
 * - Rate limits logout attempts
 * - Explicitly clears all auth cookies
 * - Adds security headers
 * - Implements request timeout
 * 
 * Security: Protected against header injection, SSRF, and logout spam
 */
export async function POST() {
    try {
        const h = await nextHeaders();
        
        // Security: Get client IP for rate limiting
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        "unknown";
        
        // Security: Rate limiting
        if (isRateLimited(clientIP)) {
            console.warn(`[Logout] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { ok: false, error: "Too many logout attempts. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "Content-Type": "application/json; charset=utf-8",
                    }
                }
            );
        }
        
        // Security: Validate host header
        const host = h.get("x-forwarded-host") ?? h.get("host");
        if (!host) {
            console.error("[Logout] Missing host header");
            return NextResponse.json(
                { ok: false, error: "Invalid request" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        if (!validateHost(host)) {
            console.error(`[Logout] Invalid host header: ${host}`);
            return NextResponse.json(
                { ok: false, error: "Invalid request" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        // Security: Validate protocol
        const proto = h.get("x-forwarded-proto") ?? "http";
        if (!ALLOWED_PROTOCOLS.includes(proto)) {
            console.error(`[Logout] Invalid protocol: ${proto}`);
            return NextResponse.json(
                { ok: false, error: "Invalid request" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }

        const base = `${proto}://${host}`;

        // Performance: Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        try {
            // Forward the POST with cookies so Better-Auth can invalidate the session
            const res = await fetch(`${base}/api/auth/sign-out`, {
                method: "POST",
                headers: { 
                    cookie: h.get("cookie") ?? "",
                    "Content-Type": "application/json",
                },
                cache: "no-store",
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

            // Security: Validate response status
            if (!res.ok && res.status !== 401) {
                console.warn(`[Logout] Better-Auth returned non-OK status: ${res.status}`);
            }

            // Get the response data and headers
            const data = await res.json().catch((err) => {
                console.warn("[Logout] Failed to parse Better-Auth response:", err);
                return { ok: true };
            });
            const headers = new Headers(res.headers);
        
            // Security: Explicitly clear all auth-related cookies with proper flags
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
            
            // Security: Add cache control and security headers
            headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
            headers.set("Pragma", "no-cache");
            headers.set("Expires", "0");
            headers.set("X-Content-Type-Options", "nosniff");
            
            return NextResponse.json(data, {
                status: res.status,
                headers,
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Performance: Handle timeout specifically
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                console.error("[Logout] Better-Auth request timed out");
                return NextResponse.json(
                    { ok: false, error: "Logout request timed out" },
                    { 
                        status: 504,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    }
                );
            }
            
            // Re-throw to be caught by outer catch
            throw fetchError;
        }
    } catch (e) {
        console.error("[Logout] Error:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details to client
        return NextResponse.json(
            { ok: false, error: "Logout failed" },
            { 
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" }
            }
        );
    }
}
