/**
 * Liveness Probe API
 * 
 * GET /api/health/live - Kubernetes/Docker liveness probe
 * 
 * Security:
 * - Rate limited (120 checks per minute per IP)
 * - No auth required (orchestrator access)
 * - No sensitive information exposure in production
 * 
 * Performance:
 * - Instant response (no external checks)
 * - Minimal response payload
 * - Lightest possible implementation
 * 
 * Differences from other health endpoints:
 * - /api/health/live (this): Is the process alive? (no external checks)
 * - /api/health/ready: Is the app ready to serve traffic? (checks database)
 * - /api/health: Overall system health (checks database + cache)
 * 
 * Returns:
 * - 200: Application process is alive
 * - 429: Rate limit exceeded
 */

import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api-middleware';
import { log } from '@/lib/logger';
import { getHealthHeaders } from '../utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LivenessStatus {
  status: 'alive';
  timestamp: string;
  uptime?: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
  };
}

/**
 * GET /api/health/live
 * 
 * Liveness probe - instant response, no external dependencies
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Public endpoint for orchestrators
    rateLimit: {
      key: 'health:live',
      limit: 120, // Most lenient - orchestrators poll frequently
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async () => {
    try {
      const livenessStatus: LivenessStatus = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        // Only include uptime and memory in non-production
        ...(process.env.NODE_ENV !== 'production' && {
          uptime: process.uptime(),
          memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          },
        }),
      };

      return NextResponse.json(livenessStatus, {
        status: 200,
        headers: getHealthHeaders(),
      });
    } catch (error) {
      // If we reach here, something is seriously wrong
      // But we still return 200 since the process is alive (able to handle the request)
      log.error('Liveness check error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return NextResponse.json(
        {
          status: 'alive',
          timestamp: new Date().toISOString(),
        } as LivenessStatus,
        {
          status: 200,
          headers: getHealthHeaders(),
        }
      );
    }
  }
);