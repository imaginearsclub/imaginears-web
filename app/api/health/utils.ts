/**
 * Shared utilities for health check endpoints
 * 
 * Implements DRY principles for service checking and timeout handling
 */

import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { log } from '@/lib/logger';

/**
 * Timeout constants
 */
export const TIMEOUTS = {
  REQUEST: 5000, // 5 seconds max for overall health checks
  DATABASE: 3000, // 3 seconds max for DB check
  CACHE: 2000, // 2 seconds max for cache check
} as const;

/**
 * Service check result types
 */
export type ServiceStatus = 'up' | 'down' | 'slow';

export interface ServiceCheckResult {
  status: ServiceStatus;
  latency: number;
}

/**
 * Helper: Check database health with timeout
 * Performance: Uses Promise.race for fast timeout
 * Memory Safety: No cleanup needed, Promise handles it
 */
export async function checkDatabase(
  timeoutMs: number = TIMEOUTS.DATABASE
): Promise<ServiceCheckResult> {
  const start = Date.now();

  try {
    // Use Promise.race for timeout protection
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as health_check`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), timeoutMs)
      ),
    ]);

    const latency = Date.now() - start;
    const status: ServiceStatus = latency > 1000 ? 'slow' : 'up';

    return { status, latency };
  } catch (error) {
    const latency = Date.now() - start;
    log.warn('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
      latency,
    });

    return { status: 'down', latency };
  }
}

/**
 * Helper: Check cache health with timeout
 * Performance: Uses minimal test key that auto-expires
 * Memory Safety: Test key auto-expires, no cleanup needed
 */
export async function checkCache(timeoutMs: number = TIMEOUTS.CACHE): Promise<ServiceCheckResult> {
  const start = Date.now();
  const testKey = `health-${Date.now()}-${Math.random()}`;
  const testValue = 'ok';

  try {
    // Use Promise.race for timeout protection
    await Promise.race([
      (async () => {
        await cache.set(testKey, testValue, 5); // 5 second TTL
        const retrieved = await cache.get(testKey);
        if (retrieved !== testValue) {
          throw new Error('Cache value mismatch');
        }
        // Note: Test key auto-expires in 5 seconds (no cleanup needed)
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cache timeout')), timeoutMs)
      ),
    ]);

    const latency = Date.now() - start;
    const status: ServiceStatus = latency > 500 ? 'slow' : 'up';

    return { status, latency };
  } catch (error) {
    const latency = Date.now() - start;
    log.warn('Cache health check failed', {
      error: error instanceof Error ? error.message : String(error),
      latency,
    });

    return { status: 'down', latency };
  }
}

/**
 * Helper: Get health check response headers
 * Security: No-cache headers to prevent stale health data
 */
export function getHealthHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

/**
 * Helper: Get rate limit headers
 */
export function getRateLimitHeaders(retryAfter: string = '60'): Record<string, string> {
  return {
    'Retry-After': retryAfter,
    ...getHealthHeaders(),
  };
}

/**
 * Helper: Determine overall health status
 * Logic: Any service down = unhealthy, any slow = degraded, otherwise healthy
 */
export function determineOverallStatus(services: {
  database?: ServiceStatus;
  cache?: ServiceStatus;
}): 'healthy' | 'degraded' | 'unhealthy' {
  const allStatuses = Object.values(services).filter((s): s is ServiceStatus => !!s);

  const anyDown = allStatuses.some((s) => s === 'down');
  if (anyDown) return 'unhealthy';

  const anySlow = allStatuses.some((s) => s === 'slow');
  if (anySlow) return 'degraded';

  return 'healthy';
}

/**
 * Helper: Get HTTP status code for health result
 */
export function getHttpStatus(overallStatus: 'healthy' | 'degraded' | 'unhealthy'): number {
  switch (overallStatus) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 207; // Multi-Status
    case 'unhealthy':
      return 503; // Service Unavailable
  }
}

/**
 * Helper: Get non-production debug info
 * Security: Only include in non-production
 */
export function getDebugInfo(
  startTime: number,
  dbResult?: ServiceCheckResult,
  cacheResult?: ServiceCheckResult
): Record<string, unknown> | {} {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }

  const debugInfo: Record<string, unknown> = {
    responseTime: `${Date.now() - startTime}ms`,
  };

  if (dbResult) {
    debugInfo['databaseLatency'] = `${dbResult.latency}ms`;
  }

  if (cacheResult) {
    debugInfo['cacheLatency'] = `${cacheResult.latency}ms`;
  }

  return debugInfo;
}

