/**
 * Health Check API
 * 
 * GET /api/health - Overall system health check
 * 
 * Security:
 * - Rate limited (30 checks per minute per IP)
 * - No auth required (public health check)
 * - No sensitive information exposure in production
 * 
 * Performance:
 * - Independent timeouts for DB (3s) and cache (2s) checks
 * - Parallel service checks
 * - Latency tracking with "slow" detection
 * - Overall timeout (5s)
 * 
 * Returns:
 * - 200: All services healthy
 * - 207: Services degraded (some slow)
 * - 429: Rate limit exceeded
 * - 503: Services unhealthy
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-middleware';
import { log } from '@/lib/logger';
import {
  checkDatabase,
  checkCache,
  getHealthHeaders,
  determineOverallStatus,
  getHttpStatus,
  getDebugInfo,
} from './utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down' | 'slow';
    cache: 'up' | 'down' | 'slow';
  };
  uptime: number;
  version?: string;
  responseTime?: string;
  databaseLatency?: string;
  cacheLatency?: string;
}

/**
 * GET /api/health
 * 
 * Comprehensive health check for all services
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Public health check
    rateLimit: {
      key: 'health',
      limit: 30, // 30 checks per minute
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async () => {
    const startTime = Date.now();

    try {
      // Performance: Run health checks in parallel with independent timeouts
      const [dbResult, cacheResult] = await Promise.all([checkDatabase(), checkCache()]);

      // Determine overall health status
      const overallStatus = determineOverallStatus({
        database: dbResult.status,
        cache: cacheResult.status,
      });

      // Build response
      const timestamp = new Date().toISOString();
      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp,
        services: {
          database: dbResult.status,
          cache: cacheResult.status,
        },
        uptime: process.uptime(),
        // Security: Only include version in non-production environments
        ...(process.env.NODE_ENV !== 'production' && {
          version: process.env['npm_package_version'] || '1.0.0',
        }),
        // Include debug info in non-production
        ...getDebugInfo(startTime, dbResult, cacheResult),
      };

      const httpStatus = getHttpStatus(overallStatus);

      log.info('Health check completed', {
        status: overallStatus,
        database: dbResult.status,
        cache: cacheResult.status,
        httpStatus,
      });

      return NextResponse.json(healthStatus, {
        status: httpStatus,
        headers: getHealthHeaders(),
      });
    } catch (error) {
      log.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Build error response
      const timestamp = new Date().toISOString();
      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        timestamp,
        services: {
          database: 'down',
          cache: 'down',
        },
        uptime: process.uptime(),
        // Security: Only include error details in non-production
        ...(process.env.NODE_ENV !== 'production' &&
          error instanceof Error && {
            error: error.message,
          }),
        ...getDebugInfo(startTime),
      };

      return NextResponse.json(healthStatus, {
        status: 503,
        headers: getHealthHeaders(),
      });
    }
  }
);
