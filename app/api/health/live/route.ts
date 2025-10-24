import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Rate limiting (simple in-memory)
const livenessCheckRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_LIVENESS_CHECKS = 120; // Max 120 checks per minute per IP (highest limit - cheapest check)

/**
 * Security: Check rate limiting
 * Returns true if rate limit exceeded
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = livenessCheckRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        // Reset or create new record
        livenessCheckRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    
    if (record.count > MAX_LIVENESS_CHECKS) {
        return true;
    }
    
    return false;
}

/**
 * Performance: Cleanup old rate limit records
 * Runs periodically to prevent memory leaks
 */
function cleanupRateLimitRecords(): void {
    const now = Date.now();
    for (const [key, record] of livenessCheckRequests.entries()) {
        if (now > record.resetTime) {
            livenessCheckRequests.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitRecords, 300000);

/**
 * GET /api/health/live
 * 
 * Liveness probe for Kubernetes/Docker/orchestration deployments.
 * Returns 200 if the application process is alive (not crashed/deadlocked).
 * 
 * This endpoint is optimized for very frequent polling by orchestrators:
 * - No external dependency checks (instant response)
 * - Highest rate limit (120/min)
 * - Minimal response payload
 * - Extremely fast execution
 * 
 * Security features:
 * - Rate limiting (120 checks per minute per IP)
 * - No sensitive information exposure in production
 * - Security headers
 * 
 * Differences from other health endpoints:
 * - /api/health/live (this): Is the process alive? (no external checks)
 * - /api/health/ready: Is the app ready to serve traffic? (checks database)
 * - /api/health: Overall system health (checks database + cache)
 * 
 * Returns:
 * - 200: Application process is alive
 * - 429: Rate limit exceeded
 */
export async function GET() {
  try {
    const h = await nextHeaders();
    
    // Security: Get client IP for rate limiting
    const forwardedFor = h.get("x-forwarded-for");
    const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                    h.get("x-real-ip") || 
                    "unknown";
    
    // Security: Rate limiting (most lenient for liveness checks)
    if (isRateLimited(clientIP)) {
        console.warn(`[Liveness] Rate limit exceeded for IP: ${clientIP}`);
        return NextResponse.json(
            { 
                status: "rate_limited",
                message: "Too many liveness check requests" 
            },
            { 
                status: 429,
                headers: {
                    "Retry-After": "60",
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                }
            }
        );
    }
    
    // Performance: Minimal response payload for speed
    return NextResponse.json(
        { 
            status: "alive", 
            timestamp: new Date().toISOString(),
            // Only include uptime in non-production
            ...(process.env.NODE_ENV !== "production" && {
                uptime: process.uptime(),
                memory: {
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                },
            }),
        },
        { 
            status: 200,
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, private",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
  } catch (error) {
    // If we reach here, something is seriously wrong
    console.error("[Liveness] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    
    // Still return 200 since the process is alive (able to handle the request)
    // Liveness probes should only fail if the process is dead/unresponsive
    return NextResponse.json(
        { 
            status: "alive",
            timestamp: new Date().toISOString(),
        },
        { 
            status: 200,
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": "application/json; charset=utf-8",
            },
        }
    );
  }
}
