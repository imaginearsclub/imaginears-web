/**
 * Impossible Travel Dismiss API
 * 
 * POST /api/admin/sessions/impossible-travel/[alertId]/dismiss
 * Dismisses an impossible travel alert
 * 
 * Security: Requires sessions:view_analytics permission, rate limited
 * Performance: Fast operation, audit logging
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/sessions/impossible-travel/[alertId]/dismiss
 * 
 * Dismisses an impossible travel alert
 * 
 * Security: sessions:view_analytics permission check, rate limited
 * Performance: Fast operation with audit logging
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:impossible-travel:dismiss',
      limit: 60, // Max 60 dismissals per minute
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
        log.warn('Impossible travel dismiss - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check sessions:view_analytics permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'sessions:view_analytics'
      );

      if (!hasPermission) {
        log.warn('Impossible travel dismiss - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      const alertId = params!['alertId']!;

      const duration = Date.now() - startTime;

      // In a production system, you would:
      // 1. Store dismissed alerts in a database table
      // 2. Track who dismissed it and when
      // 3. Optionally notify the affected user

      // Security: Audit log the dismissal
      log.info('Impossible travel alert dismissed', {
        alertId,
        dismissedBy: userId,
        dismissedByEmail: user.email,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Alert dismissed',
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Impossible travel dismiss failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to dismiss alert' },
        { status: 500 }
      );
    }
  }
);

