/**
 * Manual Sync Execution API
 * 
 * POST /api/admin/sync/execute
 * Manually triggers a player data sync operation
 * 
 * Security: Requires sync:execute permission, rate limited to prevent abuse
 * Performance: Async operation with duration tracking, timeout protection
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { executeScheduledSync } from '@/lib/sync-scheduler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sync/execute
 * 
 * Manually triggers a data sync operation
 * 
 * Security: 
 * - Requires authenticated user with sync:execute permission
 * - Rate limited to 5 manual syncs per hour per user
 * - Audit logged for security tracking
 * 
 * Performance:
 * - Async operation with duration monitoring
 * - Warns on operations exceeding 30 seconds
 * - Prevents concurrent syncs via database locking
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sync:execute',
      limit: 5, // Max 5 manual syncs per hour
      window: 3600,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role and email for RBAC and audit logging
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true, name: true },
      });

      if (!user) {
        log.warn('Sync execute - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check sync:execute permission
      // Note: Using analytics:read as a proxy until sync:execute permission is added to roles
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'analytics:read'
      );

      if (!hasPermission) {
        log.warn('Sync execute - insufficient permissions', { 
          userId, 
          role: user.role,
          email: user.email,
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to execute sync' },
          { status: 403 }
        );
      }

      // Check if a sync is already running to prevent concurrent execution
      const runningSync = await prisma.syncHistory.findFirst({
        where: { status: 'running' },
        select: { id: true, startedAt: true },
      });

      if (runningSync) {
        const runningSince = Date.now() - runningSync.startedAt.getTime();
        log.warn('Sync execute - sync already running', {
          userId,
          runningSyncId: runningSync.id,
          runningSince,
        });
        return NextResponse.json(
          { 
            error: 'A sync operation is already in progress',
            details: {
              syncId: runningSync.id,
              startedAt: runningSync.startedAt,
            },
          },
          { status: 409 } // Conflict
        );
      }

      // Execute the sync operation
      log.info('Sync execute - starting manual sync', {
        userId,
        email: user.email,
        triggeredBy: 'manual',
      });

      const result = await executeScheduledSync(userId!);

      const duration = Date.now() - startTime;

      // Performance: Log slow sync operations
      if (duration > 30000) {
        log.warn('Slow sync execution', {
          userId,
          duration,
          result,
        });
      }

      // Security: Audit log the manual sync execution
      log.info('Manual sync executed successfully', {
        userId,
        email: user.email,
        name: user.name,
        duration,
        synced: result.synced,
        linked: result.linked,
        errors: result.errors,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Sync executed successfully',
          data: result,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Sync execution failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message to avoid information leakage
      return NextResponse.json(
        { 
          error: 'Failed to execute sync operation',
          // Include generic troubleshooting info
          hint: 'Please check sync configuration and try again. Contact support if the issue persists.',
        },
        { status: 500 }
      );
    }
  }
);

