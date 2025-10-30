/**
 * User Devices Analytics API
 * 
 * GET /api/analytics/user-devices
 * Returns anonymous aggregated statistics about browsers, OS, and devices
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
  userDevicesQuerySchema,
  type UserDevicesQuery,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Calculate percentage
 */
function calculatePercentage(count: number, total: number): string {
  return total > 0 ? ((count / total) * 100).toFixed(1) : '0';
}

/**
 * GET /api/analytics/user-devices
 * 
 * Returns anonymous device analytics
 * 
 * Query Parameters:
 * - days: Number of days to analyze (1-365, default: 30)
 * 
 * Security:
 * - Requires dashboard:stats permission
 * - Rate limited to 60 requests per minute
 * - NO user identifiers or IPs - fully anonymous
 * 
 * Performance:
 * - 6 parallel database aggregation queries
 * - Efficient groupBy operations
 * - Duration monitoring
 * - Client-side caching (120 seconds)
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'analytics:user-devices',
      limit: 60,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: userDevicesQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();
    const query = validatedQuery as UserDevicesQuery;

    try {
      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'dashboard:stats'))) {
        log.warn('User devices analytics permission denied', { userId });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission dashboard:stats' },
          { status: 403 }
        );
      }

      log.info('Fetching user devices analytics', {
        userId,
        days: query.days,
      });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - query.days);

      // Fetch all device statistics in parallel (6 queries)
      // Using Promise.allSettled for memory safety
      const results = await Promise.allSettled([
        // Browser distribution
        prisma.session.groupBy({
          by: ['browser'],
          where: {
            createdAt: { gte: cutoffDate },
            browser: { not: null },
          },
          _count: true,
        }),
        // OS distribution
        prisma.session.groupBy({
          by: ['os'],
          where: {
            createdAt: { gte: cutoffDate },
            os: { not: null },
          },
          _count: true,
        }),
        // Device type distribution
        prisma.session.groupBy({
          by: ['deviceType'],
          where: {
            createdAt: { gte: cutoffDate },
            deviceType: { not: null },
          },
          _count: true,
        }),
        // Browser + OS combinations (top 10)
        prisma.session.groupBy({
          by: ['browser', 'os'],
          where: {
            createdAt: { gte: cutoffDate },
            browser: { not: null },
            os: { not: null },
          },
          _count: true,
          take: 10,
        }),
        // Trusted device OS distribution
        prisma.trustedDevice.groupBy({
          by: ['os'],
          where: {
            createdAt: { gte: cutoffDate },
            os: { not: null },
            isTrusted: true,
          },
          _count: true,
        }),
        // Trusted device type distribution
        prisma.trustedDevice.groupBy({
          by: ['deviceType'],
          where: {
            createdAt: { gte: cutoffDate },
            deviceType: { not: null },
            isTrusted: true,
          },
          _count: true,
        }),
      ]);

      // Extract results with error handling
      const [
        browserStatsResult,
        osStatsResult,
        deviceTypeStatsResult,
        combinationStatsResult,
        platformStatsResult,
        trustedDeviceTypeStatsResult,
      ] = results;

      // Check for failures
      const failedQueries = results.filter((r) => r.status === 'rejected');
      if (failedQueries.length > 0) {
        log.error('Some device analytics queries failed', {
          userId,
          failedCount: failedQueries.length,
          errors: failedQueries.map((r) => (r as PromiseRejectedResult).reason),
        });
      }

      // Extract values with defaults
      const browserStats = browserStatsResult.status === 'fulfilled' ? browserStatsResult.value : [];
      const osStats = osStatsResult.status === 'fulfilled' ? osStatsResult.value : [];
      const deviceTypeStats = deviceTypeStatsResult.status === 'fulfilled' ? deviceTypeStatsResult.value : [];
      const combinationStats = combinationStatsResult.status === 'fulfilled' ? combinationStatsResult.value : [];
      const platformStats = platformStatsResult.status === 'fulfilled' ? platformStatsResult.value : [];
      const trustedDeviceTypeStats = trustedDeviceTypeStatsResult.status === 'fulfilled' ? trustedDeviceTypeStatsResult.value : [];

      // Calculate totals for percentages
      const totalSessions = browserStats.reduce((sum, stat) => sum + stat._count, 0);
      const totalTrustedDevices = platformStats.reduce((sum, stat) => sum + stat._count, 0);

      // Transform data with percentages
      const browsers = browserStats.map((stat) => ({
        name: stat.browser || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalSessions),
      }));

      const operatingSystems = osStats.map((stat) => ({
        name: stat.os || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalSessions),
      }));

      const deviceTypes = deviceTypeStats.map((stat) => ({
        name: stat.deviceType || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalSessions),
      }));

      const combinations = combinationStats.map((stat) => ({
        combination: `${stat.browser} on ${stat.os}`,
        browser: stat.browser || 'Unknown',
        os: stat.os || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalSessions),
      }));

      const trustedPlatforms = platformStats.map((stat) => ({
        name: stat.os || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalTrustedDevices),
      }));

      const trustedDeviceTypes = trustedDeviceTypeStats.map((stat) => ({
        name: stat.deviceType || 'Unknown',
        count: stat._count,
        percentage: calculatePercentage(stat._count, totalTrustedDevices),
      }));

      const duration = Date.now() - startTime;

      // Performance: Log slow queries
      if (duration > 1000) {
        log.warn('Slow user devices analytics query', {
          userId,
          days: query.days,
          duration,
        });
      }

      log.info('User devices analytics fetched successfully', {
        userId,
        days: query.days,
        duration,
        totalSessions,
        totalTrustedDevices,
      });

      return NextResponse.json(
        {
          success: true,
          period: `${query.days} days`,
          totalSessions,
          totalTrustedDevices,
          browsers,
          operatingSystems,
          deviceTypes,
          combinations,
          trustedPlatforms,
          trustedDeviceTypes,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            // Cache for 120 seconds (device data changes slowly)
            'Cache-Control': 'private, max-age=120',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to fetch user devices analytics', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch user device analytics',
        },
        { status: 500 }
      );
    }
  }
);
