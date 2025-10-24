import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Rate limiting for session checks
const sessionCheckRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_SESSION_CHECKS = 60; // Max 60 checks per minute per IP (1 per second)

/**
 * Security: Check rate limiting
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = sessionCheckRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        sessionCheckRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    return record.count > MAX_SESSION_CHECKS;
}

/**
 * Performance: Cleanup old rate limit records
 */
function cleanupRateLimitRecords(): void {
    const now = Date.now();
    for (const [key, record] of sessionCheckRequests.entries()) {
        if (now > record.resetTime) {
            sessionCheckRequests.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitRecords, 300000);

/**
 * GET /api/auth/session-check
 * 
 * Lightweight session validation endpoint for middleware.
 * This is called by middleware to validate sessions before allowing
 * access to protected routes (e.g., /admin).
 * 
 * Security:
 * - Rate limited (60 checks per minute per IP)
 * - Fails closed (returns 401 on any error)
 * - No sensitive information in response
 * - Fast validation for middleware
 * 
 * Returns:
 * - 200: Session is valid
 * - 401: Session is invalid or missing
 * - 429: Rate limit exceeded
 * 
 * CRITICAL: Do not remove this endpoint - middleware depends on it!
 */
export async function GET() {
    try {
        const h = await nextHeaders();
        
        // Security: Get client IP for rate limiting
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        "unknown";
        
        // Security: Rate limiting (lenient for legitimate middleware calls)
        if (isRateLimited(clientIP)) {
            console.warn(`[Session Check] Rate limit exceeded for IP: ${clientIP}`);
            return NextResponse.json(
                { valid: false, error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "Content-Type": "application/json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                        "Cache-Control": "no-store, private",
                    }
                }
            );
        }
        
        // Validate session
        const session = await getServerSession();
        
        // Security: Fail closed - any missing data means invalid
        if (!session?.user?.id) {
            return NextResponse.json(
                { valid: false },
                { 
                    status: 401,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                        "Cache-Control": "no-store, private",
                    }
                }
            );
        }
        
        // Session is valid
        return NextResponse.json(
            { 
                valid: true,
                // Include minimal data for logging/debugging (no sensitive info)
                userId: session.user.id.substring(0, 8) + "...", // Truncated for security
            },
            {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "no-store, private",
                }
            }
        );
    } catch (error) {
        // Security: Fail closed - any error means invalid session
        console.error("[Session Check] Error:", error instanceof Error ? error.message : "Unknown error");
        
        return NextResponse.json(
            { valid: false },
            { 
                status: 401,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "no-store, private",
                }
            }
        );
    }
}

