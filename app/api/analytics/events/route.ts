/**
 * Events Analytics API
 * 
 * GET /api/analytics/events
 * Returns analytics for top performing events
 * 
 * Security: Permission-based access, rate limited
 * Performance: Efficient query with limit
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { getTopEvents } from '@/lib/analytics';
import {
  eventsQuerySchema,
  type EventsQuery,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/events
 * 
 * Returns top performing events analytics
 * 
 * Query Parameters:
 * - limit: Number of events to return (1-100, default: 10)
 * 
 * Security:
 * - Requires analytics:read permission
 * - Rate limited to 60 requests per minute
 * 
 * Performance:
 * - Single efficient query with limit
 * - Duration monitoring
 * - Client-side caching (60 seconds)
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'analytics:events',
      limit: 60,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: eventsQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();
    const query = validatedQuery as EventsQuery;

    try {
      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'analytics:read'))) {
        log.warn('Events analytics permission denied', { userId });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission analytics:read' },
          { status: 403 }
        );
      }

      log.info('Fetching events analytics', {
        userId,
        limit: query.limit,
      });

      // Fetch top events
      const topEvents = await getTopEvents(query.limit);

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 500) {
        log.warn('Slow events analytics query', {
          userId,
          limit: query.limit,
          duration,
        });
      }

      log.info('Events analytics fetched successfully', {
        userId,
        limit: query.limit,
        duration,
        eventCount: topEvents.length,
      });

      return NextResponse.json(
        {
          success: true,
          topEvents: topEvents.map((e) => ({
            eventId: e.eventId,
            eventTitle: e.eventTitle,
            category: e.category,
            startAt: e.startAt.toISOString(),
            totalViews: e.totalViews,
            uniqueVisitors: e.uniqueVisitors,
            totalClicks: e.totalClicks,
            favoriteCount: e.favoriteCount,
          })),
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            // Cache for 60 seconds
            'Cache-Control': 'private, max-age=60',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch events analytics', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch event analytics',
        },
        { status: 500 }
      );
    }
  }
);
