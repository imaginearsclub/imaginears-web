import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds max for health checks
const DB_TIMEOUT_MS = 3000; // 3 seconds max for DB check
const CACHE_TIMEOUT_MS = 2000; // 2 seconds max for cache check

// Security: Rate limiting (simple in-memory)
const healthCheckRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_HEALTH_CHECKS = 30; // Max 30 checks per minute per IP

/**
 * Security: Check rate limiting
 * Returns true if rate limit exceeded
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = healthCheckRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        // Reset or create new record
        healthCheckRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    
    if (record.count > MAX_HEALTH_CHECKS) {
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
    for (const [key, record] of healthCheckRequests.entries()) {
        if (now > record.resetTime) {
            healthCheckRequests.delete(key);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitRecords, 300000);

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: "up" | "down" | "slow";
    cache: "up" | "down" | "slow";
  };
  uptime: number;
  version?: string;
}

/**
 * Performance: Check database with timeout
 */
async function checkDatabase(): Promise<{ status: "up" | "down" | "slow"; latency: number }> {
    const start = Date.now();
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
        
        // Use a more comprehensive check - verify we can actually query the database
        await Promise.race([
            prisma.$queryRaw`SELECT 1 as health_check`,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Database timeout")), DB_TIMEOUT_MS)
            ),
        ]);
        
        clearTimeout(timeoutId);
        
        const latency = Date.now() - start;
        const status = latency > 1000 ? "slow" : "up"; // Mark as slow if > 1 second
        
        return { status, latency };
    } catch (error) {
        const latency = Date.now() - start;
        console.error("[Health] Database check failed:", error instanceof Error ? error.message : "Unknown error");
        return { status: "down", latency };
    }
}

/**
 * Performance: Check cache with timeout
 */
async function checkCache(): Promise<{ status: "up" | "down" | "slow"; latency: number }> {
    const start = Date.now();
    const testKey = `health-${Date.now()}-${Math.random()}`;
    const testValue = "ok";
    
    try {
        await Promise.race([
            (async () => {
                await cache.set(testKey, testValue, 5);
                const retrieved = await cache.get(testKey);
                if (retrieved !== testValue) {
                    throw new Error("Cache value mismatch");
                }
                // Note: Test key will auto-expire in 5 seconds
            })(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Cache timeout")), CACHE_TIMEOUT_MS)
            ),
        ]);
        
        const latency = Date.now() - start;
        const status = latency > 500 ? "slow" : "up"; // Mark as slow if > 500ms
        
        return { status, latency };
    } catch (error) {
        const latency = Date.now() - start;
        console.error("[Health] Cache check failed:", error instanceof Error ? error.message : "Unknown error");
        return { status: "down", latency };
    }
}

/**
 * GET /api/health
 * 
 * Health check endpoint for monitoring service status.
 * 
 * Security features:
 * - Rate limiting (30 checks per minute per IP)
 * - Request timeout (5 seconds)
 * - No sensitive information exposure in production
 * - Security headers
 * 
 * Performance features:
 * - Independent timeouts for DB (3s) and cache (2s) checks
 * - Parallel service checks
 * - Latency tracking with "slow" detection
 * 
 * Returns:
 * - 200: All services healthy
 * - 207: Services degraded (some slow)
 * - 429: Rate limit exceeded
 * - 503: Services unhealthy
 */
export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const h = await nextHeaders();
    
    // Security: Get client IP for rate limiting
    const forwardedFor = h.get("x-forwarded-for");
    const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                    h.get("x-real-ip") || 
                    "unknown";
    
    // Security: Rate limiting
    if (isRateLimited(clientIP)) {
        console.warn(`[Health] Rate limit exceeded for IP: ${clientIP}`);
        return NextResponse.json(
            { 
                status: "rate_limited",
                message: "Too many health check requests" 
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
    
    // Performance: Run health checks in parallel with overall timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
        const [dbResult, cacheResult] = await Promise.all([
            checkDatabase(),
            checkCache(),
        ]);
        
        clearTimeout(timeoutId);
        
        // Determine overall health status
        const anyDown = dbResult.status === "down" || cacheResult.status === "down";
        const anySlow = dbResult.status === "slow" || cacheResult.status === "slow";
        
        const overallStatus: HealthStatus["status"] = 
            anyDown ? "unhealthy" : 
            anySlow ? "degraded" : 
            "healthy";
        
        const healthStatus: HealthStatus = {
            status: overallStatus,
            timestamp,
            services: {
                database: dbResult.status,
                cache: cacheResult.status,
            },
            uptime: process.uptime(),
            // Security: Only include version in non-production environments
            ...(process.env.NODE_ENV !== "production" && { 
                version: process.env['npm_package_version'] || "1.0.0" 
            }),
        };

        const responseTime = Date.now() - startTime;
        
        // Determine HTTP status code
        const httpStatus = anyDown ? 503 : anySlow ? 207 : 200;
        
        return NextResponse.json({
            ...healthStatus,
            responseTime: `${responseTime}ms`,
            // Only include detailed latencies in non-production
            ...(process.env.NODE_ENV !== "production" && {
                databaseLatency: `${dbResult.latency}ms`,
                cacheLatency: `${cacheResult.latency}ms`,
            }),
        }, {
            status: httpStatus,
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, private",
                "Pragma": "no-cache",
                "Expires": "0",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": "application/json; charset=utf-8",
            },
        });
    } catch (checkError) {
        clearTimeout(timeoutId);
        
        // Handle timeout specifically
        if (checkError instanceof Error && checkError.name === "AbortError") {
            console.error("[Health] Health check timed out");
            return NextResponse.json({
                status: "unhealthy",
                timestamp,
                services: {
                    database: "down",
                    cache: "down",
                },
                uptime: process.uptime(),
                message: "Health check timeout",
            } as HealthStatus & { message: string }, {
                status: 503,
                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "X-Content-Type-Options": "nosniff",
                },
            });
        }
        
        throw checkError;
    }
    
  } catch (error) {
    console.error("[Health] Unexpected error:", error instanceof Error ? error.message : "Unknown error");
    
    const healthStatus: HealthStatus = {
      status: "unhealthy",
      timestamp,
      services: {
        database: "down",
        cache: "down",
      },
      uptime: process.uptime(),
    };

    // Security: Don't expose internal error details in production
    return NextResponse.json({
      ...healthStatus,
      ...(process.env.NODE_ENV !== "production" && error instanceof Error && {
        error: error.message,
      }),
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "X-Content-Type-Options": "nosniff",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
}
