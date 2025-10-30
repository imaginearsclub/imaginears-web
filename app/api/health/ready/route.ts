/**
 * Readiness Probe API
 * 
 * GET /api/health/ready - Kubernetes/Docker readiness probe
 * 
 * Security:
 * - Rate limited (60 checks per minute per IP)
 * - No auth required (orchestrator access)
 * - No sensitive information exposure in production
 * 
 * Performance:
 * - Faster timeout (3s vs 5s for health check)
 * - Higher rate limit (60/min vs 30/min)
 * - Minimal response payload
 * - Only checks critical dependency (database)
 * 
 * Differences from other health endpoints:
 * - /api/health/live: Is the process alive? (no external checks)
 * - /api/health/ready (this): Is the app ready to serve traffic? (checks database)
 * - /api/health: Overall system health (checks database + cache)
 * 
 * Returns:
 * - 200: Application ready to serve traffic
 * - 429: Rate limit exceeded
 * - 503: Application not ready (database unavailable)
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-middleware';
import { log } from '@/lib/logger';
import { checkDatabase, getHealthHeaders, getDebugInfo } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  responseTime?: string;
  databaseLatency?: string;
  error?: string;
}

/**
 * GET /api/health/ready
 * 
 * Readiness probe - checks if application can serve traffic
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Public endpoint for orchestrators
    rateLimit: {
      key: 'health:ready',
      limit: 60, // More lenient than health check for orchestrators
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async () => {
    const startTime = Date.now();

    try {
      // Check database connectivity
      const dbResult = await checkDatabase();

      if (dbResult.status === 'up') {
        log.info('Readiness check passed', {
          databaseLatency: dbResult.latency,
        });

        const readinessStatus: ReadinessStatus = {
          status: 'ready',
          timestamp: new Date().toISOString(),
          // Only include latency in non-production
          ...getDebugInfo(startTime, dbResult),
        };

        return NextResponse.json(readinessStatus, {
          status: 200,
          headers: getHealthHeaders(),
        });
      }

      // Database is down or slow
      log.warn('Readiness check failed', {
        databaseStatus: dbResult.status,
        databaseLatency: dbResult.latency,
      });

      const readinessStatus: ReadinessStatus = {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        // Security: Don't expose error details in production
        ...(process.env.NODE_ENV !== 'production' && {
          error: 'Database unavailable',
          ...getDebugInfo(startTime, dbResult),
        }),
      };

      return NextResponse.json(readinessStatus, {
        status: 503,
        headers: getHealthHeaders(),
      });
    } catch (error) {
      log.error('Readiness check failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      const readinessStatus: ReadinessStatus = {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        // Security: Only include error details in non-production
        ...(process.env.NODE_ENV !== 'production' &&
          error instanceof Error && {
            error: error.message,
            ...getDebugInfo(startTime),
          }),
      };

      return NextResponse.json(readinessStatus, {
        status: 503,
        headers: getHealthHeaders(),
      });
    }
  }
);
