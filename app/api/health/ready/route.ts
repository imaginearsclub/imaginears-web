import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Performance: Constants
const DB_TIMEOUT_MS = 3000; // 3 seconds max for DB check

// Security: Rate limiting (simple in-memory)
const readinessCheckRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_READINESS_CHECKS = 60; // Max 60 checks per minute per IP (higher than health check)

/**
 * Security: Check rate limiting
 * Returns true if rate limit exceeded
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = readinessCheckRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        // Reset or create new record
        readinessCheckRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    
    if (record.count > MAX_READINESS_CHECKS) {
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
    for (const [key, record] of readinessCheckRequests.entries()) {
        if (now > record.resetTime) {
            readinessCheckRequests.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitRecords, 300000);

/**
 * Performance: Check database with timeout
 */
async function checkDatabase(): Promise<{ ready: boolean; latency: number; error?: string }> {
    const start = Date.now();
    
    try {
        await Promise.race([
            prisma.$queryRaw`SELECT 1 as readiness_check`,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), DB_TIMEOUT_MS)
            ),
        ]);
        
        const latency = Date.now() - start;
        return { ready: true, latency };
    } catch (error) {
        const latency = Date.now() - start;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("[Readiness] Database check failed:", errorMsg);
        return { ready: false, latency, error: errorMsg };
    }
}

/**
 * GET /api/health/ready
 * 
 * Readiness probe for Kubernetes/Docker/orchestration deployments.
 * Returns 200 if the application is ready to serve traffic.
 * 
 * This endpoint is optimized for frequent polling by orchestrators:
 * - Faster timeout (3s vs 5s for health check)
 * - Higher rate limit (60/min vs 30/min)
 * - Minimal response payload
 * - Only checks critical dependency (database)
 * 
 * Security features:
 * - Rate limiting (60 checks per minute per IP)
 * - Request timeout (3 seconds)
 * - No sensitive information exposure in production
 * - Security headers
 * 
 * Returns:
 * - 200: Application ready to serve traffic
 * - 429: Rate limit exceeded
 * - 503: Application not ready (database unavailable)
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    const h = await nextHeaders();
    
    // Security: Get client IP for rate limiting
    const forwardedFor = h.get("x-forwarded-for");
    const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                    h.get("x-real-ip") || 
                    "unknown";
    
    // Security: Rate limiting (more lenient than health check for orchestrators)
    if (isRateLimited(clientIP)) {
        console.warn(`[Readiness] Rate limit exceeded for IP: ${clientIP}`);
        return NextResponse.json(
            { 
                status: "rate_limited",
                message: "Too many readiness check requests" 
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
    
    // Performance: Check database with timeout
    const dbResult = await checkDatabase();
    
    if (dbResult.ready) {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json(
            { 
                status: "ready", 
                timestamp: new Date().toISOString(),
                // Only include latency in non-production
                ...(process.env.NODE_ENV !== "production" && {
                    responseTime: `${responseTime}ms`,
                    databaseLatency: `${dbResult.latency}ms`,
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
    } else {
        const responseTime = Date.now() - startTime;
        
        return NextResponse.json(
            { 
                status: "not_ready", 
                timestamp: new Date().toISOString(),
                // Security: Don't expose error details in production
                ...(process.env.NODE_ENV !== "production" && {
                    error: dbResult.error,
                    responseTime: `${responseTime}ms`,
                    databaseLatency: `${dbResult.latency}ms`,
                }),
            },
            { 
                status: 503,
                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "X-Content-Type-Options": "nosniff",
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    }
  } catch (error) {
    console.error("[Readiness] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    
    // Security: Don't expose internal error details in production
    return NextResponse.json(
      { 
        status: "not_ready", 
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== "production" && error instanceof Error && {
            error: error.message,
        }),
      },
      { 
        status: 503,
        headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Content-Type-Options": "nosniff",
            "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
