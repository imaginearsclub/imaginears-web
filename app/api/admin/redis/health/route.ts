/**
 * Redis Health Check API
 * 
 * GET /api/admin/redis/health
 * Get comprehensive Redis health status and metrics
 * 
 * Security: Owner/Admin only, rate limited
 * Performance: Cached for 10 seconds
 */

import { NextResponse } from "next/server";
import { getRedisHealth } from "@/lib/redis-monitor";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkRedisPermission } from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 10 seconds (frequent health checks)
const CACHE_SECONDS = 10;

/**
 * GET /api/admin/redis/health
 * 
 * Returns comprehensive Redis health metrics
 * 
 * Security: Owner/Admin role check, rate limited
 * Performance: 10-second cache, duration monitoring
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "redis:health",
      limit: 120, // Allow frequent health checks (2 per second)
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // Check permission
      if (!(await checkRedisPermission(userId!))) {
        return NextResponse.json(
          { error: "Forbidden: Redis monitoring is restricted to Owners and Admins" },
          { status: 403 }
        );
      }

      // Get Redis health status
      const health = await getRedisHealth();

      const duration = Date.now() - startTime;

      // Performance: Log slow health checks
      if (duration > 1000) {
        log.warn("Slow Redis health check", { userId, duration });
      }

      log.info("Redis health checked", {
        userId,
        duration,
        connectedClients: health.connectedClients,
      });

      return NextResponse.json(health, {
        headers: {
          "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          "X-Response-Time": `${duration}ms`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Redis health check failed", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Don't expose internal error details
      return NextResponse.json(
        { error: "Failed to fetch Redis health" },
        { status: 500 }
      );
    }
  }
);

