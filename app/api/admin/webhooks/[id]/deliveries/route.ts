/**
 * Webhook Deliveries API
 * 
 * GET /api/admin/webhooks/[id]/deliveries
 * Get delivery logs for a specific webhook
 * 
 * Security: Permission-based access, rate limited
 * Performance: Parallel queries, efficient pagination, statistics aggregation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import {
  webhookDeliveriesQuerySchema,
  type WebhookDeliveriesQuery,
  type WebhookDeliveriesResponse,
} from '../../schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/webhooks/[id]/deliveries
 * 
 * Get delivery logs for a webhook with filtering and pagination
 * 
 * Query Parameters:
 * - status: Filter by delivery status (pending, success, failed, retrying)
 * - eventType: Filter by event type
 * - limit: Number of deliveries per page (1-100, default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * Security:
 * - Requires webhooks:read permission
 * - Rate limited to 120 requests per minute
 * 
 * Performance:
 * - Parallel queries for deliveries, count, and statistics
 * - Efficient database aggregation
 * - Client-side caching
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:deliveries',
      limit: 120,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: webhookDeliveriesQuerySchema,
  },
  async (_req, { userId, validatedQuery, params }) => {
    const startTime = Date.now();
    const query = validatedQuery as WebhookDeliveriesQuery;

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:read'))) {
        log.warn('Webhook deliveries permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:read' },
          { status: 403 }
        );
      }

      log.info('Fetching webhook deliveries', {
        userId,
        webhookId: id,
        filters: {
          status: query.status,
          eventType: query.eventType,
          limit: query.limit,
          offset: query.offset,
        },
      });

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { webhookId: id };
      if (query.status) {
        where.status = query.status;
      }
      if (query.eventType) {
        where.eventType = query.eventType;
      }

      // Fetch deliveries, total count, and statistics in parallel
      const [deliveries, totalCount, stats] = await Promise.all([
        prisma.webhookDelivery.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset,
        }),
        prisma.webhookDelivery.count({ where }),
        prisma.webhookDelivery.groupBy({
          by: ['status'],
          where: { webhookId: id },
          _count: true,
        }),
      ]);

      // Calculate statistics
      const statistics = {
        total: totalCount,
        success: stats.find((s) => s.status === 'success')?._count || 0,
        failed: stats.find((s) => s.status === 'failed')?._count || 0,
        pending: stats.find((s) => s.status === 'pending')?._count || 0,
        retrying: stats.find((s) => s.status === 'retrying')?._count || 0,
      };

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 1000) {
        log.warn('Slow webhook deliveries query', {
          userId,
          webhookId: id,
          duration,
          totalCount,
          filters: query,
        });
      }

      log.info('Webhook deliveries fetched successfully', {
        userId,
        webhookId: id,
        duration,
        count: deliveries.length,
        totalCount,
      });

      const response: WebhookDeliveriesResponse = {
        deliveries,
        totalCount,
        statistics,
        hasMore: query.offset + query.limit < totalCount,
      };

      return NextResponse.json(
        {
          success: true,
          ...response,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            // Cache for 15 seconds
            'Cache-Control': 'private, max-age=15',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch webhook deliveries', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch webhook deliveries',
        },
        { status: 500 }
      );
    }
  }
);
