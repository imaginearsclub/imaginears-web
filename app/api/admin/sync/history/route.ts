/**
 * Sync History API
 * 
 * GET /api/admin/sync/history
 * Retrieves paginated sync history and statistics
 * 
 * Security: Requires analytics:read permission, rate limited
 * Performance: Cached statistics, optimized pagination queries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { getSyncHistory, getSyncStatistics } from '@/lib/sync-scheduler';
import { syncHistoryQuerySchema, type SyncHistoryQuery } from '../schemas';
import { jsonOk, jsonError } from '@/app/api/admin/sessions/response';
import { tryConditionalGet } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/history
 * 
 * Retrieves sync history with pagination and statistics
 * 
 * Query Parameters:
 * - limit: Number of records to return (1-200, default: 50)
 * - offset: Number of records to skip (default: 0)
 * 
 * Security:
 * - Requires authenticated user with analytics:read permission
 * - Rate limited to 60 requests per minute
 * 
 * Performance:
 * - Validated query parameters prevent excessive data fetching
 * - Parallel execution of history and statistics queries
 * - Response time monitoring for slow queries
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sync:history',
      limit: 60, // Max 60 requests per minute
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: syncHistoryQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user) {
        log.warn('Sync history - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check analytics:read permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'analytics:read'
      );

      if (!hasPermission) {
        log.warn('Sync history - insufficient permissions', { 
          userId, 
          role: user.role,
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to view sync history' },
          { status: 403 }
        );
      }

      // Extract validated query parameters
      const query = validatedQuery as SyncHistoryQuery;

      // Performance: Execute history fetch and statistics in parallel
      const [historyResult, statistics] = await Promise.all([
        getSyncHistory(query.limit, query.offset),
        getSyncStatistics(),
      ]);

      const { history, totalCount } = historyResult;
      const hasMore = query.offset + query.limit < totalCount;

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 2000) {
        log.warn('Slow sync history query', {
          userId,
          duration,
          limit: query.limit,
          offset: query.offset,
          totalCount,
        });
      }

      log.info('Sync history retrieved', {
        userId,
        duration,
        limit: query.limit,
        offset: query.offset,
        recordsReturned: history.length,
        totalCount,
      });

      const payload = {
        success: true,
        data: {
          history,
          totalCount,
          statistics,
          pagination: {
            limit: query.limit,
            offset: query.offset,
            hasMore,
            nextOffset: hasMore ? query.offset + query.limit : null,
          },
        },
      } as const;
      const decision = tryConditionalGet(_req, payload, { 'X-Total-Count': totalCount.toString() });
      if (decision.status === 304) {
        return jsonOk(_req, null, { headers: decision.headers, status: 304 as unknown as number });
      }
      return jsonOk(_req, payload, { headers: { ...decision.headers, 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Sync history fetch failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to fetch sync history', 500);
    }
  }
);