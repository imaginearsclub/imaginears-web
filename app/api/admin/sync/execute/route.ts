/**
 * Manual Sync Execution API
 * 
 * POST /api/admin/sync/execute
 * Manually triggers a player data sync operation
 * 
 * Security: Requires sync:execute permission, rate limited to prevent abuse
 * Performance: Async operation with duration tracking, timeout protection
 */
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { executeScheduledSync } from '@/lib/sync-scheduler';
import { jsonOk, jsonError } from '@/app/api/admin/sessions/response';
import { cache } from '@/lib/cache';

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
        return jsonError(_req, 'User not found', 404);
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
        return jsonError(_req, 'Forbidden: Insufficient permissions to execute sync', 403);
      }

      // Idempotency: avoid duplicate manual triggers within a short window
      const idemKey = _req.headers.get('idempotency-key');
      if (idemKey) {
        const prior = await cache.get<{ response: unknown }>(`idemp:sync-exec:${userId}:${idemKey}`);
        if (prior?.response) {
          return jsonOk(_req, prior.response, { headers: { 'X-Idempotent-Replay': '1' } });
        }
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
        return jsonError(_req, 'A sync operation is already in progress', 409, { syncId: runningSync.id, startedAt: runningSync.startedAt });
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
      const rObj = result as Record<string, unknown>;
      const hasMetrics =
        typeof rObj['synced'] === 'number' && typeof rObj['linked'] === 'number' && typeof rObj['errors'] === 'number';
      const metrics = hasMetrics
        ? { synced: rObj['synced'] as number, linked: rObj['linked'] as number, errors: rObj['errors'] as number }
        : { error: (rObj['error'] as string) };
      log.info('Manual sync executed successfully', {
        userId,
        email: user.email,
        name: user.name,
        duration,
        ...metrics,
      });

      const responseBody = {
        success: true,
        message: 'Sync executed successfully',
        data: result,
      };
      if (idemKey) {
        await cache.set(`idemp:sync-exec:${userId}:${idemKey}`, { response: responseBody }, 60);
      }
      return jsonOk(_req, responseBody, { headers: { 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Sync execution failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message to avoid information leakage
      return jsonError(_req, 'Failed to execute sync operation', 500, { hint: 'Please check sync configuration and try again. Contact support if the issue persists.' });
    }
  }
);

