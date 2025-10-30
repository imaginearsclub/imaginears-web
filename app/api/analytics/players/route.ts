/**
 * Players Analytics API
 * 
 * GET /api/analytics/players
 * Returns player engagement and retention analytics
 * 
 * Security: Permission-based access, rate limited
 * Performance: 3 parallel queries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { getActivePlayers, getPlayerRetention } from '@/lib/analytics';
import { getTopPlayersByPlaytime } from '@/lib/minecraft-analytics';
import {
  playersQuerySchema,
  type PlayersQuery,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Transform active player data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformActivePlayers(players: any[]) {
  return players.map((p) => ({
    id: p.id,
    userId: p.userId,
    minecraftName: p.minecraftName || 'Unknown',
    minecraftUuid: p.minecraftUuid || '',
    totalWebVisits: p.totalWebVisits || 0,
    totalMinecraftTime: p.totalMinecraftTime || 0,
    totalMinecraftJoins: p.totalMinecraftJoins || 0,
    webEngagementScore: p.webEngagementScore || 0,
    mcEngagementScore: p.mcEngagementScore || 0,
    overallEngagement: p.overallEngagement || 0,
    lastActiveAt: p.lastActiveAt?.toISOString() || new Date().toISOString(),
  }));
}

/**
 * Helper: Transform top players data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTopPlayers(players: any[]) {
  return players.map((p) => ({
    minecraftName: p.minecraftName || 'Unknown',
    totalMinecraftTime: p.totalMinecraftTime || 0,
    totalMinecraftJoins: p.totalMinecraftJoins || 0,
  }));
}

/**
 * GET /api/analytics/players
 * 
 * Returns player analytics and engagement metrics
 * 
 * Query Parameters:
 * - days: Number of days for active player analysis (1-365, default: 30)
 * 
 * Security:
 * - Requires analytics:read permission
 * - Rate limited to 60 requests per minute
 * 
 * Performance:
 * - 3 parallel queries with Promise.allSettled
 * - Efficient data transformation
 * - Duration monitoring
 * - Client-side caching (60 seconds)
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'analytics:players',
      limit: 60,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: playersQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();
    const query = validatedQuery as PlayersQuery;

    try {
      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'analytics:read'))) {
        log.warn('Players analytics permission denied', { userId });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission analytics:read' },
          { status: 403 }
        );
      }

      log.info('Fetching players analytics', { userId, days: query.days });

      // Fetch player analytics data in parallel (3 queries)
      const results = await Promise.allSettled([
        getActivePlayers(query.days),
        getPlayerRetention(),
        getTopPlayersByPlaytime(10),
      ]);

      // Extract results
      const [activePlayersResult, retentionResult, topPlayersResult] = results;

      // Check for failures
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        log.error('Some player analytics queries failed', {
          userId,
          failedCount: failed.length,
          errors: failed.map((r) => (r as PromiseRejectedResult).reason),
        });
      }

      // Extract values with defaults
      const activePlayers = activePlayersResult.status === 'fulfilled' ? activePlayersResult.value : [];
      const retention = retentionResult.status === 'fulfilled' ? retentionResult.value : null;
      const topPlayers = topPlayersResult.status === 'fulfilled' ? topPlayersResult.value : [];

      const duration = Date.now() - startTime;

      if (duration > 1000) {
        log.warn('Slow players analytics query', { userId, days: query.days, duration });
      }

      log.info('Players analytics fetched successfully', {
        userId,
        days: query.days,
        duration,
        activePlayerCount: activePlayers.length,
        topPlayerCount: topPlayers.length,
      });

      return NextResponse.json(
        {
          success: true,
          activePlayers: transformActivePlayers(activePlayers),
          retention,
          topPlayers: transformTopPlayers(topPlayers),
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            'Cache-Control': 'private, max-age=60',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch players analytics', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch player analytics' },
        { status: 500 }
      );
    }
  }
);
