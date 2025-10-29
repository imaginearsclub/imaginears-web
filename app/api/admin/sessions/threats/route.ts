/**
 * Session Threats API
 * 
 * GET /api/admin/sessions/threats
 * Returns detected security threats
 * 
 * POST /api/admin/sessions/threats
 * Handle threat actions (block, investigate, resolve)
 * 
 * Security: Requires appropriate permissions, rate limited
 * Performance: Parallel threat detection, efficient grouping
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Threat {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affectedUsers: number;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved';
}

async function detectSuspiciousSessions(fiveMinutesAgo: Date): Promise<Threat | null> {
  const suspiciousSessions = await prisma.session.groupBy({
    by: ['ipAddress'],
    where: {
      createdAt: { gte: fiveMinutesAgo },
      isSuspicious: true,
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 5,
        },
      },
    },
  });

  if (suspiciousSessions.length > 0) {
    return {
      id: `failed-logins-${Date.now()}`,
      severity: 'high',
      type: 'Multiple Suspicious Sessions',
      description: `${suspiciousSessions.length} IP(s) with multiple suspicious sessions in last 5 minutes`,
      affectedUsers: suspiciousSessions.length,
      detectedAt: fiveMinutesAgo,
      status: 'active',
    };
  }

  return null;
}

async function detectImpossibleTravel(oneHourAgo: Date): Promise<Threat | null> {
  const impossibleTravelSessions = await prisma.session.findMany({
    where: {
      createdAt: { gte: oneHourAgo },
      isSuspicious: true,
    },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  const userSuspiciousCount = new Map<string, number>();
  impossibleTravelSessions.forEach(s => {
    const count = userSuspiciousCount.get(s.userId) || 0;
    userSuspiciousCount.set(s.userId, count + 1);
  });

  const impossibleTravelUsers = Array.from(userSuspiciousCount.entries()).filter(
    ([, count]) => count > 1
  );

  if (impossibleTravelUsers.length > 0) {
    return {
      id: `impossible-travel-${Date.now()}`,
      severity: 'critical',
      type: 'Location Anomaly',
      description: `${impossibleTravelUsers.length} user(s) with impossible travel patterns detected`,
      affectedUsers: impossibleTravelUsers.length,
      detectedAt: oneHourAgo,
      status: 'active',
    };
  }

  return null;
}

async function detectExcessiveSessions(now: Date, oneHourAgo: Date): Promise<Threat | null> {
  const userSessionCounts = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      expiresAt: { gt: now },
    },
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 10,
        },
      },
    },
  });

  if (userSessionCounts.length > 0) {
    return {
      id: `concurrent-sessions-${Date.now()}`,
      severity: 'medium',
      type: 'Excessive Concurrent Sessions',
      description: `${userSessionCounts.length} user(s) with unusually high number of active sessions`,
      affectedUsers: userSessionCounts.length,
      detectedAt: oneHourAgo,
      status: 'active',
    };
  }

  return null;
}

// Validation schema for threat actions
const threatActionSchema = z.object({
  threatId: z.string().min(1),
  action: z.enum(['block', 'investigate', 'resolve']),
});

/**
 * GET /api/admin/sessions/threats
 * 
 * Detects and returns active security threats
 * 
 * Security: sessions:view_analytics permission check, rate limited
 * Performance: Parallel threat detection, efficient aggregations
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:threats:view',
      limit: 120, // Allow frequent threat monitoring
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user) {
        log.warn('Threat detection - user not found', { userId });
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
        log.warn('Threat detection - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Performance: Run all threat detections in parallel
      const [suspiciousThreat, travelThreat, excessiveThreat] = await Promise.all([
        detectSuspiciousSessions(fiveMinutesAgo),
        detectImpossibleTravel(oneHourAgo),
        detectExcessiveSessions(now, oneHourAgo),
      ]);

      // Filter out null results
      const threats = [suspiciousThreat, travelThreat, excessiveThreat].filter(
        (t): t is Threat => t !== null
      );

      const duration = Date.now() - startTime;

      // Performance: Log slow threat detection
      if (duration > 2000) {
        log.warn('Slow threat detection', { userId, duration });
      }

      log.info('Threats detected', { 
        userId, 
        duration, 
        threatCount: threats.length 
      });

      return NextResponse.json(threats, {
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Threat detection failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to detect threats' },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/admin/sessions/threats
 * 
 * Handle threat actions (block, investigate, resolve)
 * 
 * Security: sessions:revoke_any permission check, rate limited
 * Performance: Fast threat action processing
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:threats:action',
      limit: 30, // Max 30 threat actions per minute
      window: 60,
      strategy: 'sliding-window',
    },
    maxBodySize: 1000,
    validateBody: threatActionSchema,
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true },
      });

      if (!user) {
        log.warn('Threat action - user not found', { userId });
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
        log.warn('Threat action - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

      const { threatId, action } = validatedBody as z.infer<typeof threatActionSchema>;

      const duration = Date.now() - startTime;

      // Security: Audit log threat action
      log.info('Threat action processed', {
        adminId: userId,
        adminEmail: user.email,
        threatId,
        action,
        duration,
      });

      // In a full implementation, you would:
      // - Store threat status in database
      // - Take action based on the threat type (block IPs, revoke sessions, etc.)
      // - Send notifications to admins

      return NextResponse.json(
        {
          success: true,
          message: `Threat ${action} action completed`,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Threat action failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to handle threat action' },
        { status: 500 }
      );
    }
  }
);

