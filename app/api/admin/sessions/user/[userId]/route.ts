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
import { userHasPermissionAsync } from '@/lib/rbac-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: requestingUserId! },
        select: { role: true },
      });

      if (!user) {
        log.warn('User sessions - requesting user not found', { userId: requestingUserId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:view_all permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'sessions:view_all'
      );

      if (!hasPermission) {
        log.warn('User sessions - insufficient permissions', { 
          userId: requestingUserId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
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
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Fetch all sessions for this user
      const sessions = await prisma.session.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
      });

      const now = new Date();

      // Transform sessions with additional metadata
      const sessionsWithMeta = sessions.map((s) => {
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

      const duration = Date.now() - startTime;

      log.info('User sessions fetched', {
        userId: requestingUserId,
        targetUserId,
        duration,
        sessionCount: sessionsWithMeta.length,
      });

      return NextResponse.json(
        {
          user: targetUser,
          sessions: sessionsWithMeta,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('User sessions fetch failed', {
        userId: requestingUserId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to fetch user sessions' },
        { status: 500 }
      );
    }
  }
);

