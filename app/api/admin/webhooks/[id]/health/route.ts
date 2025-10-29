/**
 * Webhook Health API
 * 
 * GET /api/admin/webhooks/[id]/health
 * Get health statistics for a specific webhook
 * 
 * Security: Permission-based access, rate limited
 * Performance: Efficient health metrics aggregation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { getWebhookHealthStats } from '@/lib/webhooks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/webhooks/[id]/health
 * 
 * Get health statistics and metrics for a webhook
 * 
 * Returns:
 * - Overall health status
 * - Success rate percentage
 * - Average response time
 * - Recent error count
 * - Last successful and failed deliveries
 * - Total delivery statistics
 * 
 * Security:
 * - Requires webhooks:read permission
 * - Rate limited to 120 requests per minute
 * 
 * Performance:
 * - Leverages existing getWebhookHealthStats utility
 * - Client-side caching (30 seconds)
 * - Duration monitoring
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:health',
      limit: 120,
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:read'))) {
        log.warn('Webhook health permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:read' },
          { status: 403 }
        );
      }

      // Verify webhook exists
      const webhook = await prisma.webhook.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!webhook) {
        log.warn('Webhook not found for health check', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Webhook not found' },
          { status: 404 }
        );
      }

      log.info('Fetching webhook health stats', {
        userId,
        webhookId: id,
      });

      // Get health statistics from utility function
      const stats = await getWebhookHealthStats(id);

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 500) {
        log.warn('Slow webhook health query', {
          userId,
          webhookId: id,
          duration,
        });
      }

      log.info('Webhook health stats fetched successfully', {
        userId,
        webhookId: id,
        duration,
        isHealthy: stats.isHealthy,
        successRate: stats.successRate,
      });

      return NextResponse.json(
        {
          success: true,
          health: stats,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            // Cache for 30 seconds (health data changes slowly)
            'Cache-Control': 'private, max-age=30',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch webhook health', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch webhook health statistics',
        },
        { status: 500 }
      );
    }
  }
);
