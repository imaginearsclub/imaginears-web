/**
 * Queue Health Check API
 * 
 * GET /api/admin/queue/health
 * Returns webhook queue health statistics
 * 
 * Security: RBAC permission check (webhooks:read), rate limited
 * Performance: Cached for 10 seconds
 */

import { NextResponse } from "next/server";
import { getQueueHealth } from "@/lib/queue";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 10 seconds (frequent health checks)
const CACHE_SECONDS = 10;

/**
 * GET /api/admin/queue/health
 * 
 * Returns webhook queue system health status
 * 
 * Security: User authentication + RBAC permission (webhooks:read)
 * Performance: 10-second cache, parallel queue checks
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "queue:health",
      limit: 120, // Allow frequent health checks (2 per second)
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    // Performance: Track request duration
    const startTime = Date.now();

    try {
      // Fetch user role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user) {
        log.warn("Queue health check - user not found", { userId });
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Check RBAC permission (webhooks:read)
      const hasPermission = await userHasPermissionAsync(
        user.role,
        "webhooks:read"
      );

      if (!hasPermission) {
        log.warn("Queue health check - insufficient permissions", { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      // Get queue health status
      const health = await getQueueHealth();

      const duration = Date.now() - startTime;

      // Performance: Log slow health checks
      if (duration > 1000) {
        log.warn("Slow queue health check", { userId, duration });
      }

      log.info("Queue health checked", { 
        userId, 
        duration,
        role: user.role,
        queueCount: Object.keys(health).length
      });

      return NextResponse.json(health, {
        headers: {
          "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          "X-Response-Time": `${duration}ms`,
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      log.error("Queue health check failed", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Don't expose internal error details
      return NextResponse.json(
        { error: "Failed to get queue health" },
        { status: 500 }
      );
    }
  }
);