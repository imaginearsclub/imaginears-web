/**
 * Applications by Status Statistics API
 * 
 * GET /api/admin/stats/applications-by-status
 * Returns application counts grouped by status
 * 
 * Security: Admin-only access, rate limited
 * Performance: Database aggregation, efficient groupBy query, response caching
 */
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import type { ApplicationsStatusData } from '../schemas';
import crypto from 'node:crypto';
import { jsonOk, jsonError } from '@/app/api/admin/sessions/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats/applications-by-status
 * 
 * Returns application counts grouped by status
 * 
 * Response Format:
 * - Array of { status: string, count: number }
 * 
 * Security:
 * - Admin-only access enforced
 * - Rate limited to 120 requests per minute
 * 
 * Performance:
 * - Database groupBy aggregation (efficient)
 * - Duration monitoring
 * - Cache-Control headers for client-side caching (5 minutes)
 */
export const GET = createApiHandler(
  {
    auth: 'admin',
    rateLimit: {
      key: 'stats:applications',
      limit: 120, // Generous for dashboard refreshes
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      log.info('Applications status stats requested', { userId });

      // Group by Application.status - efficient database aggregation
      const rows = await prisma.application.groupBy({
        by: ['status'],
        _count: { _all: true },
      });

      // Transform to clean response format
      const data: ApplicationsStatusData[] = rows.map((r) => ({
        status: r.status,
        count: r._count._all,
      }));

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 500) {
        log.warn('Slow applications status stats query', {
          userId,
          duration,
          statusCount: data.length,
        });
      }

      const totalApplications = data.reduce((sum, d) => sum + d.count, 0);

      log.info('Applications status stats retrieved successfully', {
        userId,
        duration,
        totalApplications,
        statusBreakdown: data.map((d) => `${d.status}: ${d.count}`).join(', '),
      });

      // ETag support for conditional GET
      const payload = { success: true, data } as const;
      const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
      const etag = `W/"${hash}"`;
      const ifNoneMatch = _req.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return jsonOk(_req, null, { headers: { 'ETag': etag, 'Cache-Control': 'private, max-age=300' }, status: 304 as unknown as number });
      }

      return jsonOk(_req, payload, {
        headers: {
          'X-Response-Time': `${duration}ms`,
          'ETag': etag,
          'Cache-Control': 'private, max-age=300',
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Applications status stats fetch failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return empty data to allow dashboard to load gracefully
      return jsonError(_req, 'Failed to fetch applications statistics', 500, { data: [] });
    }
  }
);

