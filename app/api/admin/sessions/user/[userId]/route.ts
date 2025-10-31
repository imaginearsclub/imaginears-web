/**
 * User Sessions API
 * 
 * GET /api/admin/sessions/user/[userId]
 * Returns all sessions for a specific user
 * 
 * Security: Requires sessions:view_all permission, rate limited
 * Performance: Efficient query with metadata calculation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../../utils';
import { jsonOk, jsonError } from '../../response';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function transformSessions(sessions: Array<{ id: string; ipAddress: string | null; userAgent: string | null; country: string | null; city: string | null; isSuspicious: boolean; createdAt: Date; expiresAt: Date; updatedAt: Date; }>) {
  const now = new Date();
  return sessions.map((s) => {
    const isActive = s.expiresAt > now;
    const isExpired = s.expiresAt <= now;
    return {
      id: s.id,
      ipAddress: s.ipAddress || 'Unknown',
      userAgent: s.userAgent || 'Unknown',
      country: s.country || 'Unknown',
      city: s.city || null,
      isSuspicious: s.isSuspicious,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isActive,
      isExpired,
      lastActivity: s.updatedAt,
    };
  });
}

/**
 * GET /api/admin/sessions/user/[userId]
 * 
 * Returns all sessions for a specific user with metadata
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: Single query with includes
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:user-detail',
      limit: 120, // Allow frequent user session checks
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId: requestingUserId, params }) => {
    const startTime = Date.now();

    try {
      // RBAC
      if (!(await checkSessionsPermission(requestingUserId!, SESSIONS_PERMISSIONS.VIEW_ALL))) {
        return jsonError(_req, 'Forbidden: Insufficient permissions', 403);
      }

      const targetUserId = params!['userId']!;

      // Fetch user info
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!targetUser) {
        log.warn('User sessions - target user not found', { 
          userId: requestingUserId, 
          targetUserId 
        });
        return jsonError(_req, 'User not found', 404);
      }

      // Fetch all sessions for this user
      const sessions = await prisma.session.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
      });

      const sessionsWithMeta = transformSessions(sessions);

      const duration = Date.now() - startTime;

      log.info('User sessions fetched', {
        userId: requestingUserId,
        targetUserId,
        duration,
        sessionCount: sessionsWithMeta.length,
      });

      const payload = { user: targetUser, sessions: sessionsWithMeta };
      const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
      const etag = `W/"${hash}"`;
      const ifNoneMatch = _req.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: { 'ETag': etag },
        });
      }
      return jsonOk(_req, payload, { headers: { 'X-Response-Time': `${duration}ms`, 'ETag': etag } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('User sessions fetch failed', {
        userId: requestingUserId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to fetch user sessions', 500);
    }
  }
);

