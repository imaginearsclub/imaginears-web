/**
 * Session Revoke API
 * 
 * POST /api/admin/sessions/revoke/[sessionId]
 * Revokes a specific session by ID
 * 
 * Security: Requires sessions:revoke_any permission, rate limited
 * Performance: Single database transaction, audit logging
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';

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
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true },
      });

      if (!user) {
        log.warn('Session revoke - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:revoke_any permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'sessions:revoke_any'
      );

      if (!hasPermission) {
        log.warn('Session revoke - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      const sessionId = params!['sessionId']!;

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
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
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
        adminEmail: user.email,
        targetUserId: targetSession.userId,
        targetUserEmail: targetSession.user.email,
        sessionId,
        ipAddress: targetSession.ipAddress,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Session revoked successfully',
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Session revoke failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to revoke session' },
        { status: 500 }
      );
    }
  }
);

