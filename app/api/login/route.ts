import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const REQUEST_TIMEOUT_MS = 10000; // 10 second timeout for auth
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PASSWORD_LENGTH = 128;
const MAX_REQUEST_BODY_SIZE = 1024; // 1KB max

// Security: Rate limiting (simple in-memory)
const loginAttempts = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
const RATE_LIMIT_WINDOW_MS = 300000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 5; // Max 5 failed attempts per 5 minutes per IP
const BLOCK_DURATION_MS = 900000; // 15 minute block after exceeding limit

/**
 * Security: Basic email format validation
 * RFC 5322 simplified pattern
 */
function isValidEmailFormat(email: string): boolean {
    if (!email || email.length > MAX_EMAIL_LENGTH) {
        return false;
    }
    // Basic email pattern - intentionally simple for performance
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

/**
 * Security: Validate password meets basic requirements
 */
function isValidPasswordFormat(password: string): boolean {
    if (!password) return false;
    if (password.length > MAX_PASSWORD_LENGTH) return false;
    // Allow all characters, just check length
    return password.length >= 8 && password.length <= MAX_PASSWORD_LENGTH;
}

/**
 * Security: Check and record rate limiting
 * Returns true if rate limit exceeded
 */
function checkRateLimit(identifier: string, success: boolean): { limited: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = loginAttempts.get(identifier);
    
    // Check if currently blocked
    if (record?.blocked) {
        const blockEnds = record.resetTime;
        if (now < blockEnds) {
            return { limited: true, retryAfter: Math.ceil((blockEnds - now) / 1000) };
        }
        // Block expired, remove record
        loginAttempts.delete(identifier);
    }
    
    // Reset expired window
    if (!record || now > record.resetTime) {
        if (success) {
            loginAttempts.delete(identifier);
            return { limited: false };
        }
        loginAttempts.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
            blocked: false,
        });
        return { limited: false };
    }
    
    // Success resets the counter
    if (success) {
        loginAttempts.delete(identifier);
        return { limited: false };
    }
    
    // Increment failure count
    record.count++;
    
    // Block if exceeded
    if (record.count > MAX_LOGIN_ATTEMPTS) {
        record.blocked = true;
        record.resetTime = now + BLOCK_DURATION_MS;
        const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
        console.warn(`[Login] IP ${identifier} blocked for ${retryAfter} seconds after ${record.count} failed attempts`);
        return { limited: true, retryAfter };
    }
    
    return { limited: false };
}

/**
 * Security: Validate origin URL to prevent SSRF
 */
function validateOriginUrl(origin: string): boolean {
    try {
        const url = new URL(origin);
        
        // Only allow http/https
        if (!["http:", "https:"].includes(url.protocol)) {
            return false;
        }
        
        // In production, block localhost and private IPs
        if (process.env.NODE_ENV === "production") {
            const hostname = url.hostname.toLowerCase();
            const isLocalhost = /^(localhost|127\.|::1|0\.0\.0\.0)/i.test(hostname);
            const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i.test(hostname);
            if (isLocalhost || isPrivateIP) {
                return false;
            }
        }
        
        return true;
    } catch {
        return false;
    }
}

/**
 * POST /api/login
 * 
 * Legacy login route - proxies to Better-Auth for consistency.
 * This ensures a single source of truth for password verification.
 * 
 * Security features:
 * - Rate limiting (5 attempts per 5 minutes, 15 minute block)
 * - Input validation (email format, password length)
 * - Request timeout (10 seconds)
 * - SSRF prevention
 * - Security headers
 * - IP-based tracking
 * 
 * @deprecated This route exists for backward compatibility.
 * New applications should use Better-Auth directly.
 */
export async function POST(req: Request) {
    try {
        const h = await nextHeaders();
        
        // Security: Get client IP for rate limiting
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        "unknown";
        
        // Security: Pre-check rate limit before processing
        const preCheck = checkRateLimit(clientIP, false);
        if (preCheck.limited) {
            console.warn(`[Login] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { error: "Too many login attempts. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": String(preCheck.retryAfter || 900),
                        "Content-Type": "application/json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                    }
                }
            );
        }
        
        // Security: Parse and validate request body
        let body: any;
        try {
            const text = await req.text();
            
            // Security: Check body size
            if (text.length > MAX_REQUEST_BODY_SIZE) {
                console.warn(`[Login] Request body too large: ${text.length} bytes`);
                return NextResponse.json(
                    { error: "Request too large" },
                    { 
                        status: 413,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    }
                );
            }
            
            body = JSON.parse(text);
        } catch {
            console.warn("[Login] Invalid JSON in request body");
            return NextResponse.json(
                { error: "Invalid request format" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        // Security: Validate email format
        const email = body?.email;
        if (!email || typeof email !== "string" || !isValidEmailFormat(email)) {
            console.warn(`[Login] Invalid email format from IP: ${clientIP}`);
            return NextResponse.json(
                { error: "Invalid email address" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        // Security: Validate password format
        const password = body?.password;
        if (!password || typeof password !== "string" || !isValidPasswordFormat(password)) {
            console.warn(`[Login] Invalid password format from IP: ${clientIP}`);
            return NextResponse.json(
                { error: "Invalid password" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        // Security: Validate origin URL
        const origin = process.env['BETTER_AUTH_URL'] || process.env['NEXT_PUBLIC_SITE_URL'] || "http://localhost:3000";
        if (!validateOriginUrl(origin)) {
            console.error(`[Login] Invalid origin URL configured: ${origin}`);
            return NextResponse.json(
                { error: "Server configuration error" },
                { 
                    status: 500,
                    headers: { "Content-Type": "application/json; charset=utf-8" }
                }
            );
        }
        
        // Performance: Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        try {
            const url = new URL("/api/auth/sign-in/email", origin);
            const res = await fetch(url.toString(), {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "User-Agent": "Imaginears-Login-Proxy/1.0",
                },
                body: JSON.stringify({ email, password }),
                cache: "no-store",
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            const text = await res.text();
            const success = res.ok && res.status === 200;
            
            // Security: Update rate limit based on result
            const postCheck = checkRateLimit(clientIP, success);
            if (postCheck.limited) {
                // This shouldn't happen since we pre-checked, but handle it
                return NextResponse.json(
                    { error: "Too many login attempts. Please try again later." },
                    { 
                        status: 429,
                        headers: {
                            "Retry-After": String(postCheck.retryAfter || 900),
                            "Content-Type": "application/json; charset=utf-8",
                        }
                    }
                );
            }
            
            // Log authentication result (without sensitive data)
            if (success) {
                console.log(`[Login] Successful login for: ${email.substring(0, 3)}***`);
            } else {
                console.warn(`[Login] Failed login attempt for: ${email.substring(0, 3)}*** from IP: ${clientIP}`);
            }
            
            // Security: Add security headers
            const headers = new Headers();
            headers.set("Content-Type", res.headers.get("content-type") || "application/json");
            headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
            headers.set("Pragma", "no-cache");
            headers.set("X-Content-Type-Options", "nosniff");
            
            // Forward Better-Auth cookies
            const setCookieHeaders = res.headers.getSetCookie();
            for (const cookie of setCookieHeaders) {
                headers.append("Set-Cookie", cookie);
            }
            
            return new NextResponse(text, {
                status: res.status,
                headers,
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Performance: Handle timeout specifically
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                console.error("[Login] Authentication request timed out");
                return NextResponse.json(
                    { error: "Authentication service timeout" },
                    { 
                        status: 504,
                        headers: { "Content-Type": "application/json; charset=utf-8" }
                    }
                );
            }
            
            // Re-throw to outer catch
            throw fetchError;
        }
    } catch (e) {
        console.error("[Login] Error:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Authentication failed" },
            { 
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" }
            }
        );
    }
}
