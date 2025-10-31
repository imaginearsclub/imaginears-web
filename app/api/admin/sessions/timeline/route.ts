/**
 * Session Timeline API
 * 
 * GET /api/admin/sessions/timeline
 * Returns recent session activity events for the timeline
 * 
 * Security: Requires sessions:view_all permission, rate limited
 * Performance: Efficient query with take limit, 10-second cache
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../utils';
import { jsonOk, jsonError } from '../response';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache for 10 seconds (timeline updates frequently)
const CACHE_SECONDS = 10;

/**
 * GET /api/admin/sessions/timeline
 * 
 * Returns recent session events (last 24 hours, max 50)
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: 10-second cache, efficient query with limit
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:timeline',
      limit: 120, // Allow frequent timeline checks
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // RBAC
      if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.VIEW_ALL))) {
        return jsonError(_req, 'Forbidden: Insufficient permissions', 403);
      }

      // Get recent sessions (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentSessions = await prisma.session.findMany({
        where: {
          createdAt: { gte: twentyFourHoursAgo },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Limit to 50 most recent events
      });

      // Transform to timeline events
      const events = recentSessions.map((s) => {
        const isExpired = s.expiresAt < new Date();
        const isSuspicious = s.isSuspicious;

        let type: 'login' | 'logout' | 'suspicious' | 'revoked' | 'activity';
        let details: string;

        if (isSuspicious) {
          type = 'suspicious';
          details = 'Suspicious activity detected';
        } else if (isExpired) {
          type = 'logout';
          details = 'Session expired';
        } else {
          type = 'login';
          details = 'New session started';
        }

        return {
          id: s.id,
          type,
          user: s.user.email || 'Unknown User',
          timestamp: s.createdAt,
          details,
          location: s.country || undefined,
          device: s.userAgent || undefined,
        };
      });

      const duration = Date.now() - startTime;

      log.info('Session timeline fetched', { 
        userId, 
        duration, 
        eventCount: events.length 
      });

      const hash = crypto.createHash('sha1').update(JSON.stringify(events)).digest('hex');
      const etag = `W/"${hash}"`;
      const ifNoneMatch = _req.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          },
        });
      }
      return jsonOk(_req, events, {
        headers: {
          'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          'X-Response-Time': `${duration}ms`,
          'ETag': etag,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Session timeline fetch failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to fetch timeline events', 500);
    }
  }
);

