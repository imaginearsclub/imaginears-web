/**
 * Analytics Overview API
 * 
 * GET /api/analytics/overview
 * Returns comprehensive analytics overview with trends
 * 
 * Security: Permission-based access, rate limited
 * Performance: Parallel queries, efficient aggregation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import {
  getPageViews,
  getUniqueVisitors,
  getTopPages,
  getDeviceBreakdown,
  getGeographicBreakdown,
  getTopReferrers,
  getBrowserBreakdown,
  getDateRange,
  getPreviousPeriodRange,
  getActivePlayers,
} from '@/lib/analytics';
import {
  analyticsOverviewQuerySchema,
  type AnalyticsOverviewQuery,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Calculate trend percentage
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * Helper: Fetch all analytics data in parallel
 */
async function fetchAnalyticsData(
  startDate: Date,
  endDate: Date,
  prevStartDate: Date,
  prevEndDate: Date
) {
  const results = await Promise.allSettled([
    // Current period (8 queries)
    getPageViews(startDate, endDate),
    getUniqueVisitors(startDate, endDate),
    getTopPages(startDate, endDate, 10),
    getDeviceBreakdown(startDate, endDate),
    getGeographicBreakdown(startDate, endDate, 10),
    getTopReferrers(startDate, endDate, 10),
    getBrowserBreakdown(startDate, endDate),
    getActivePlayers(30),
    // Previous period for trends (3 queries)
    getPageViews(prevStartDate, prevEndDate),
    getUniqueVisitors(prevStartDate, prevEndDate),
    getActivePlayers(30),
  ]);

  return results;
}

/**
 * Helper: Extract values from Promise.allSettled results
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
function extractAnalyticsResults(results: PromiseSettledResult<any>[]) {
  return {
    pageViews: results[0]?.status === 'fulfilled' ? results[0].value : [],
    uniqueVisitors: results[1]?.status === 'fulfilled' ? results[1].value : 0,
    topPages: results[2]?.status === 'fulfilled' ? results[2].value : [],
    deviceBreakdown: results[3]?.status === 'fulfilled' ? results[3].value : [],
    geographicBreakdown: results[4]?.status === 'fulfilled' ? results[4].value : [],
    topReferrers: results[5]?.status === 'fulfilled' ? results[5].value : [],
    browserBreakdown: results[6]?.status === 'fulfilled' ? results[6].value : [],
    activePlayers: results[7]?.status === 'fulfilled' ? results[7].value : [],
    prevPageViews: results[8]?.status === 'fulfilled' ? results[8].value : [],
    prevUniqueVisitors: results[9]?.status === 'fulfilled' ? results[9].value : 0,
    prevActivePlayers: results[10]?.status === 'fulfilled' ? results[10].value : [],
  };
}

/**
 * Helper: Check analytics permission
 */
async function checkAnalyticsPermission(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || !(await userHasPermissionAsync(user.role, 'analytics:read'))) {
    log.warn('Analytics overview permission denied', { userId });
    return false;
  }

  return true;
}

/**
 * Helper: Calculate all trends
 */
function calculateAllTrends(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageViews: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevPageViews: any[];
  uniqueVisitors: number;
  prevUniqueVisitors: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activePlayers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prevActivePlayers: any[];
}) {
  const totalPageViews = data.pageViews.reduce((sum, day) => sum + day.views, 0);
  const prevTotalPageViews = data.prevPageViews.reduce((sum, day) => sum + day.views, 0);

  const avgDailyViews = data.pageViews.length > 0 ? totalPageViews / data.pageViews.length : 0;
  const prevAvgDailyViews = data.prevPageViews.length > 0 ? prevTotalPageViews / data.prevPageViews.length : 0;

  return {
    pageViews: calculateTrend(totalPageViews, prevTotalPageViews),
    uniqueVisitors: calculateTrend(data.uniqueVisitors, data.prevUniqueVisitors),
    activePlayers: calculateTrend(data.activePlayers.length, data.prevActivePlayers.length),
    avgDailyViews: calculateTrend(avgDailyViews, prevAvgDailyViews),
  };
}

/**
 * GET /api/analytics/overview
 * 
 * Returns comprehensive analytics overview
 * 
 * Query Parameters:
 * - period: Analytics period (today, week, month, quarter, year)
 * 
 * Security:
 * - Requires analytics:read permission
 * - Rate limited to 60 requests per minute
 * 
 * Performance:
 * - 11 parallel queries for efficiency
 * - Efficient trend calculations
 * - Duration monitoring
 * - Client-side caching (60 seconds)
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'analytics:overview',
      limit: 60,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: analyticsOverviewQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();
    const query = validatedQuery as AnalyticsOverviewQuery;

    try {
      // Check permission
      if (!(await checkAnalyticsPermission(userId!))) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission analytics:read' },
          { status: 403 }
        );
      }

      log.info('Fetching analytics overview', {
        userId,
        period: query.period,
      });

      const { startDate, endDate } = getDateRange(query.period);
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange(query.period);

      // Fetch all analytics data in parallel (11 queries)
      const results = await fetchAnalyticsData(startDate, endDate, prevStartDate, prevEndDate);

      // Check for failures
      const failedQueries = results.filter((r) => r.status === 'rejected');
      if (failedQueries.length > 0) {
        log.error('Some analytics queries failed', {
          userId,
          failedCount: failedQueries.length,
          errors: failedQueries.map((r) => (r as PromiseRejectedResult).reason),
        });
      }

      // Extract values from results
      const data = extractAnalyticsResults(results);

      // Calculate trends
      const trends = calculateAllTrends(data);

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 2000) {
        log.warn('Slow analytics overview query', {
          userId,
          period: query.period,
          duration,
        });
      }

      log.info('Analytics overview fetched successfully', {
        userId,
        period: query.period,
        duration,
        uniqueVisitors: data.uniqueVisitors,
      });

      return NextResponse.json(
        {
          success: true,
          period: query.period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          pageViews: data.pageViews,
          uniqueVisitors: data.uniqueVisitors,
          topPages: data.topPages,
          deviceBreakdown: data.deviceBreakdown,
          geographicBreakdown: data.geographicBreakdown,
          topReferrers: data.topReferrers,
          browserBreakdown: data.browserBreakdown,
          activePlayers: data.activePlayers.length,
          trends,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            // Cache for 60 seconds (data changes relatively slowly)
            'Cache-Control': 'private, max-age=60',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch analytics overview', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch analytics overview',
        },
        { status: 500 }
      );
    }
  }
);
