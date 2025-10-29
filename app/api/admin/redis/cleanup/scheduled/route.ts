/**
 * Scheduled Redis Cleanup API
 * 
 * GET /api/admin/redis/cleanup/scheduled
 * Trigger scheduled cleanup job (called by cron)
 * 
 * Security: CRON_SECRET authentication, no rate limit (cron controlled)
 * Performance: Duration monitoring, memory-safe cleanup
 */

import { NextResponse } from "next/server";
import { runCleanupJob } from "@/lib/queue/cleanup-scheduler";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/redis/cleanup/scheduled
 * 
 * Execute scheduled cleanup of old Redis/BullMQ jobs
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * Performance: Tracks cleanup duration and cleaned count
 * 
 * @example
 * Authorization: Bearer <CRON_SECRET>
 */
export const GET = createApiHandler(
  {
    auth: "none", // Uses custom CRON_SECRET authentication
    rateLimit: {
      key: "redis:scheduled-cleanup",
      limit: 120, // Generous limit for cron jobs
      window: 3600,
      strategy: "sliding-window",
    },
  },
  async (req) => {
    const startTime = Date.now();

    try {
      // Security: Verify cron secret
      const authHeader = req.headers.get("authorization");
      const cronSecret = process.env['CRON_SECRET'];

      if (!cronSecret) {
        log.error("Scheduled cleanup - CRON_SECRET not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      if (authHeader !== `Bearer ${cronSecret}`) {
        log.warn("Scheduled cleanup - invalid cron secret", {
          providedHeader: authHeader ? "Bearer ***" : "missing",
        });
        return NextResponse.json(
          { error: "Unauthorized: Invalid cron secret" },
          { status: 401 }
        );
      }

      // Performance: Track cleanup operation
      log.info("Scheduled cleanup started");

      // Execute cleanup
      const result = await runCleanupJob();

      const duration = Date.now() - startTime;

      // Performance: Log slow cleanup operations
      if (duration > 10000) {
        log.warn("Slow scheduled cleanup operation", {
          duration,
          result,
        });
      }

      log.info("Scheduled cleanup completed", {
        duration,
        result,
      });

      return NextResponse.json(
        {
          success: true,
          ...result,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
        },
        {
          headers: {
            "X-Response-Time": `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Scheduled cleanup failed", {
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Don't expose internal error details to cron caller
      return NextResponse.json(
        { 
          error: "Failed to run cleanup job",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }
);

