/**
 * Redis Connection Test API
 * 
 * GET /api/admin/redis/test
 * Test Redis connection and latency
 * 
 * Security: Owner/Admin only, rate limited
 * Performance: Connection latency monitoring
 */

import { NextResponse } from "next/server";
import { testRedisConnection } from "@/lib/redis-monitor";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkRedisPermission } from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/redis/test
 * 
 * Test Redis connection and measure latency
 * 
 * Security: Owner/Admin role check, rate limited
 * Performance: Tracks connection test duration
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "redis:test",
      limit: 60, // Allow 1 test per second max
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
          { error: "Forbidden: Redis testing is restricted to Owners and Admins" },
          { status: 403 }
        );
      }

      // Test Redis connection
      const result = await testRedisConnection();

      const duration = Date.now() - startTime;

      // Performance: Log slow connection tests
      if (duration > 1000) {
        log.warn("Slow Redis connection test", { userId, duration });
      }

      log.info("Redis connection tested", {
        userId,
        duration,
        success: result.success,
        latency: result.latency,
      });

      return NextResponse.json(
        {
          ...result,
          testDuration: `${duration}ms`,
        },
        {
          headers: {
            "X-Response-Time": `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Redis connection test failed", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Don't expose internal error details
      return NextResponse.json(
        { 
          error: "Failed to test Redis connection",
          success: false,
        },
        { status: 500 }
      );
    }
  }
);

