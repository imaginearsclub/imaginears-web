/**
 * Bulk Revoke Suspicious Sessions API
 * 
 * POST /api/admin/sessions/bulk-revoke-suspicious
 * Revokes all sessions flagged as suspicious
 * 
 * Security: Requires sessions:revoke_any permission, rate limited
 * Performance: Batch updates, parallel notifications
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createNotification } from '@/lib/notifications';
import { createApiHandler } from '@/lib/api-middleware';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../utils';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Permission check helper now centralized in ../utils

/**
 * Helper: Fetch, revoke suspicious sessions, and notify users
 */
async function revokeSuspiciousSessions() {
  // Find all suspicious sessions
  const suspiciousSessions = await prisma.session.findMany({
    where: {
      expiresAt: { gt: new Date() },
      isSuspicious: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (suspiciousSessions.length === 0) {
    return { revokedCount: 0, affectedUsers: 0 };
  }

  // Batch revoke all suspicious sessions
  await prisma.session.updateMany({
    where: {
      expiresAt: { gt: new Date() },
      isSuspicious: true,
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Get unique users affected and notify them
  const affectedUserIds = new Set(suspiciousSessions.map((s) => s.userId));
  await notifyAffectedUsers(affectedUserIds);

  return {
    revokedCount: suspiciousSessions.length,
    affectedUsers: affectedUserIds.size,
  };
}

/**
 * Helper: Send security notifications to affected users
 */
async function notifyAffectedUsers(userIds: Set<string>): Promise<void> {
  const notificationPromises = Array.from(userIds).map(async (affectedUserId) => {
    try {
      await createNotification({
        userId: affectedUserId,
        title: 'Session Revoked for Security',
        message:
          'Your session was terminated due to suspicious activity. Please log in again and contact support if you need assistance.',
        type: 'warning',
        category: 'security',
        priority: 'high',
      });
    } catch (error) {
      log.error('Bulk revoke - failed to notify user', { 
        userId: affectedUserId, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  await Promise.allSettled(notificationPromises);
}

/**
 * POST /api/admin/sessions/bulk-revoke-suspicious
 * 
 * Revokes all active suspicious sessions and notifies affected users
 * 
 * Security: sessions:revoke_any permission check, rate limited
 * Performance: Batch operations, parallel notifications, duration monitoring
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:bulk-revoke',
      limit: 10, // Max 10 bulk operations per hour
      window: 3600,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // RBAC: Check sessions:revoke_any permission
      if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.REVOKE_ANY))) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      // Idempotency: prevent duplicate bulk operations
      const idemKey = _req.headers.get('idempotency-key');
      if (idemKey) {
        const cacheKey = `idemp:bulk-revoke:${idemKey}`;
        const previous = await cache.get<{ done: boolean }>(cacheKey);
        if (previous?.done) {
          return NextResponse.json({
            success: true,
            message: 'Bulk revoke already processed',
            revokedCount: 0,
            affectedUsers: 0,
          });
        }
        await cache.set(cacheKey, { done: true }, 300);
      }

      // Revoke suspicious sessions and notify affected users
      const { revokedCount, affectedUsers } = await revokeSuspiciousSessions();

      if (revokedCount === 0) {
        log.info('Bulk revoke - no suspicious sessions', { userId });
        return NextResponse.json({
          success: true,
          message: 'No suspicious sessions to revoke',
          revokedCount: 0,
          affectedUsers: 0,
        });
      }

      const duration = Date.now() - startTime;

      // Performance: Log slow operations
      if (duration > 5000) {
        log.warn('Slow bulk revoke operation', {
          userId,
          duration,
          revokedCount,
        });
      }

      // Security: Audit log the bulk revoke action
      log.warn('Bulk revoked suspicious sessions', {
        adminId: userId,
        revokedCount,
        affectedUsers,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully revoked ${revokedCount} suspicious sessions affecting ${affectedUsers} users`,
          revokedCount,
          affectedUsers,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Bulk revoke suspicious sessions failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to revoke suspicious sessions' },
        { status: 500 }
      );
    }
  }
);

