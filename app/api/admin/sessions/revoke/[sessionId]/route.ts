/**
 * Session Revoke API
 * 
 * POST /api/admin/sessions/revoke/[sessionId]
 * Revokes a specific session by ID
 * 
 * Security: Requires sessions:revoke_any permission, rate limited
 * Performance: Single database transaction, audit logging
 */
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../../utils';
import { cache } from '@/lib/cache';
import { jsonOk, jsonError } from '../../response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sessions/revoke/[sessionId]
 * 
 * Revokes a specific user session immediately
 * 
 * Security: sessions:revoke_any permission check, rate limited
 * Performance: Optimized single query with include
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:revoke',
      limit: 60, // Max 60 revocations per minute
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      // Idempotency: Prevent duplicate revocations within a short window
      const idemKey = _req.headers.get('idempotency-key');
      const sessionId = params!['sessionId']!;
      if (idemKey) {
        const cacheKey = `idemp:revoke:${sessionId}:${idemKey}`;
        const previous = await cache.get<{ done: boolean }>(cacheKey);
        if (previous?.done) {
          return jsonOk(_req, { success: true, message: 'Session revoke already processed' });
        }
        // Mark as in-progress/done with short TTL
        await cache.set(cacheKey, { done: true }, 60);
      }

      // RBAC: Check sessions:revoke_any permission
      if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.REVOKE_ANY))) {
        return jsonError(_req, 'Forbidden: Insufficient permissions', 403);
      }

      // Already defined above

      // Find the session with user info
      const targetSession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!targetSession) {
        log.warn('Session revoke - session not found', { userId, sessionId });
        return jsonError(_req, 'Session not found', 404);
      }

      // Revoke the session by setting expiresAt to now
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          expiresAt: new Date(),
        },
      });

      const duration = Date.now() - startTime;

      // Security: Audit log the revocation
      log.warn('Admin revoked user session', {
        adminId: userId,
        targetUserId: targetSession.userId,
        targetUserEmail: targetSession.user.email,
        sessionId,
        ipAddress: targetSession.ipAddress,
        duration,
      });

      return jsonOk(_req, { success: true, message: 'Session revoked successfully' }, {
        headers: { 'X-Response-Time': `${duration}ms` },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Session revoke failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to revoke session', 500);
    }
  }
);