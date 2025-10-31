/**
 * Events Statistics API
 * 
 * GET /api/admin/stats/events
 * Returns event creation counts bucketed by day for a configurable range
 * 
 * Security: Admin-only access, rate limited, input validated
 * Performance: Database aggregation, efficient queries, response caching headers
 */
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { eventsStatsQuerySchema, type EventsStatsQuery, type EventsStatsData } from '../schemas';
import crypto from 'node:crypto';
import { jsonOk, jsonError } from '@/app/api/admin/sessions/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Create date map with all dates initialized to 0
 * 
 * Memory Safety: Limited size (max 90 entries)
 * Performance: Pre-allocated map for efficient updates
 */
function createDateMap(start: Date, days: number): Map<string, number> {
  const map = new Map<string, number>();
  const tempDate = new Date(start);
  
  for (let i = 0; i < days; i++) {
    const key = tempDate.toISOString().slice(0, 10);
    map.set(key, 0);
    tempDate.setUTCDate(tempDate.getUTCDate() + 1);
  }
  
  return map;
}

/**
 * Helper: Fetch event counts from database
 * 
 * Performance: Uses database aggregation for efficiency
 * Error handling: Returns empty array on database errors
 */
async function fetchEventCounts(start: Date, end: Date): Promise<Array<{ date: string; count: bigint }>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Event
      WHERE createdAt >= ${start}
        AND createdAt <= ${end}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    
    return rows;
  } catch (error) {
    log.error('Failed to fetch event counts', {
      error: error instanceof Error ? error.message : String(error),
      start,
      end,
    });
    // Return empty array to allow dashboard to load with zeros
    return [];
  }
}

/**
 * GET /api/admin/stats/events
 * 
 * Returns daily event creation statistics
 * 
 * Query Parameters:
 * - range: Number of days to include (1-90, default: 30)
 * 
 * Security:
 * - Admin-only access enforced
 * - Rate limited to 120 requests per minute
 * - Input validation with Zod
 * 
 * Performance:
 * - Database aggregation (not fetching all records)
 * - Pre-allocated date map for efficiency
 * - Duration monitoring
 * - Cache-Control headers for client-side caching
 */
export const GET = createApiHandler(
  {
    auth: 'admin',
    rateLimit: {
      key: 'stats:events',
      limit: 120, // Generous for dashboard refreshes
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: eventsStatsQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();

    try {
      const query = validatedQuery as EventsStatsQuery;
      const days = query.range;

      log.info('Events stats requested', {
        userId,
        days,
      });

      // Use start of day for consistent date boundaries (UTC)
      const end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      
      const start = new Date(end);
      start.setUTCDate(end.getUTCDate() - (days - 1));
      start.setUTCHours(0, 0, 0, 0);

      // Create map with all dates initialized to 0
      const dateMap = createDateMap(start, days);

      // Fetch event counts from database
      const rows = await fetchEventCounts(start, end);

      // Fill in actual counts from database
      for (const row of rows) {
        const dateStr = String(row.date).slice(0, 10);
        dateMap.set(dateStr, Number(row.count));
      }

      // Convert map to array format
      const data: EventsStatsData[] = Array.from(dateMap.entries()).map(([key, count]) => ({
        date: key.slice(5), // MM-DD format
        count,
      }));

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 1000) {
        log.warn('Slow events stats query', {
          userId,
          days,
          duration,
          rowCount: rows.length,
        });
      }

      log.info('Events stats retrieved successfully', {
        userId,
        days,
        duration,
        totalEvents: data.reduce((sum, d) => sum + d.count, 0),
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

      log.error('Events stats fetch failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return empty data to allow dashboard to load
      // This is more graceful than returning an error
      return jsonError(_req, 'Failed to fetch events statistics', 500, { data: [] });
    }
  }
);
