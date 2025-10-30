/**
 * Cron Sync API
 * 
 * GET /api/cron/sync
 * Executes scheduled LuckPerms synchronization
 * 
 * Security: Bearer token authentication, no rate limiting (cron only)
 * Performance: Efficient sync execution
 * 
 * For Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { shouldExecuteSync, executeScheduledSync } from '@/lib/sync-scheduler';

export const runtime = 'nodejs';

/**
 * Helper: Verify cron secret from Authorization header
 */
function verifyCronSecret(authHeader: string | null): boolean {
  const cronSecret = process.env['CRON_SECRET'];

  // Security: Require CRON_SECRET to be set in production
  if (!cronSecret || cronSecret === 'your-secret-key-here') {
    log.error('CRON_SECRET not properly configured');
    return false;
  }

  // Verify Bearer token
  const expectedHeader = `Bearer ${cronSecret}`;
  return authHeader === expectedHeader;
}

/**
 * GET /api/cron/sync
 * 
 * Executes scheduled sync if due
 * 
 * Security:
 * - Bearer token authentication (CRON_SECRET)
 * - No rate limiting (intended for cron services only)
 * - Logs all attempts
 * 
 * Performance:
 * - Checks if sync is due before executing
 * - Duration monitoring
 * - Comprehensive logging
 * 
 * Authorization:
 * - Header: Authorization: Bearer <CRON_SECRET>
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Custom auth via Bearer token
    // Note: No rate limiting for cron endpoints (handled by cron service)
  },
  async (req) => {
    const startTime = Date.now();

    try {
      // Get Authorization header
      const authHeader = req.headers.get('authorization');

      // Verify cron secret
      if (!verifyCronSecret(authHeader)) {
        log.warn('Unauthorized cron sync attempt', {
          authHeader: authHeader ? 'present' : 'missing',
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        });

        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      log.info('Cron sync triggered');

      // Check if a sync should be executed
      const shouldSync = await shouldExecuteSync();

      if (!shouldSync) {
        const duration = Date.now() - startTime;

        log.info('Sync not scheduled at this time', { duration });

        return NextResponse.json(
          {
            success: true,
            message: 'Sync not scheduled at this time',
            skipped: true,
          },
          {
            headers: { 'X-Response-Time': `${duration}ms` },
          }
        );
      }

      // Execute the sync
      log.info('Executing scheduled sync');
      const result = await executeScheduledSync();

      const duration = Date.now() - startTime;

      log.info('Cron sync executed successfully', {
        duration,
        result,
      });

      return NextResponse.json(
        {
          message: 'Sync executed successfully',
          ...result,
          success: true,
        },
        {
          headers: { 'X-Response-Time': `${duration}ms` },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to execute cron sync', {
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to execute cron sync',
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }
);
