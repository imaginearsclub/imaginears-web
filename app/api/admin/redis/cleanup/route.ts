/**
 * Redis Cleanup API
 * 
 * POST /api/admin/redis/cleanup
 * Manually trigger cleanup of old BullMQ jobs
 * 
 * Security: Owner/Admin only, rate limited
 * Performance: Monitored cleanup duration
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanupOldJobs } from "@/lib/redis-monitor";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation schema for cleanup options
const cleanupSchema = z.object({
  completedAge: z.number().int().positive().max(365 * 24 * 60 * 60).optional().default(7 * 24 * 60 * 60), // Max 1 year
  failedAge: z.number().int().positive().max(365 * 24 * 60 * 60).optional().default(30 * 24 * 60 * 60),
  completedCount: z.number().int().positive().max(100000).optional().default(1000),
  failedCount: z.number().int().positive().max(100000).optional().default(5000),
});

/**
 * POST /api/admin/redis/cleanup
 * 
 * Manually trigger cleanup of old BullMQ jobs
 * 
 * Security: Owner/Admin role check, rate limited to prevent abuse
 * Performance: Duration monitoring, memory-safe cleanup
 */
export const POST = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "redis:cleanup",
      limit: 10, // Max 10 manual cleanups per hour
      window: 3600,
      strategy: "sliding-window",
    },
    maxBodySize: 1000,
    validateBody: cleanupSchema,
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true },
      });

      if (!user) {
        log.warn("Redis cleanup - user not found", { userId });
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // RBAC: Only Owner/Admin can trigger manual cleanup
      if (user.role !== "OWNER" && user.role !== "ADMIN") {
        log.warn("Redis cleanup - forbidden", { 
          userId, 
          role: user.role,
          email: user.email 
        });
        return NextResponse.json(
          { error: "Forbidden: Redis cleanup is restricted to Owners and Admins" },
          { status: 403 }
        );
      }

      // Type-safe access to validated body
      const body = validatedBody as z.infer<typeof cleanupSchema>;
      const { completedAge, failedAge, completedCount, failedCount } = body;

      // Performance: Track cleanup operation
      log.info("Redis cleanup started", {
        userId,
        email: user.email,
        role: user.role,
        options: { completedAge, failedAge, completedCount, failedCount },
      });

      // Execute cleanup
      const result = await cleanupOldJobs("webhooks", {
        completedAge,
        failedAge,
        completedCount,
        failedCount,
      });

      const duration = Date.now() - startTime;

      // Performance: Log slow cleanup operations
      if (duration > 5000) {
        log.warn("Slow Redis cleanup operation", {
          userId,
          duration,
          cleaned: result.cleaned,
        });
      }

      log.info("Redis cleanup completed", {
        userId,
        email: user.email,
        duration,
        cleaned: result.cleaned,
        options: { completedAge, failedAge, completedCount, failedCount },
      });

      return NextResponse.json(
        {
          success: true,
          cleaned: result.cleaned,
          message: `Cleaned ${result.cleaned} old jobs`,
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

      log.error("Redis cleanup failed", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Don't expose internal error details
      return NextResponse.json(
        { error: "Failed to cleanup old jobs" },
        { status: 500 }
      );
    }
  }
);

