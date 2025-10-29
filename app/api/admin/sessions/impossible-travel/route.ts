/**
 * Impossible Travel Detection API
 * 
 * GET /api/admin/sessions/impossible-travel
 * Detects impossible travel patterns across active sessions
 * 
 * Security: Requires sessions:view_analytics permission, rate limited
 * Performance: Efficient session grouping, parallel travel detection
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectImpossibleTravel } from '@/lib/geolocation';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ImpossibleTravelAlert {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  previousLocation: {
    city: string;
    country: string;
    ip: string;
  };
  currentLocation: {
    city: string;
    country: string;
    ip: string;
  };
  distance: number;
  timeDiff: number;
  requiredSpeed: number;
  timestamp: Date;
  status: 'pending' | 'dismissed' | 'blocked';
}

/**
 * GET /api/admin/sessions/impossible-travel
 * 
 * Detects impossible travel patterns in active sessions
 * 
 * Security: sessions:view_analytics permission check, rate limited
 * Performance: Take limit (500), efficient grouping
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:impossible-travel',
      limit: 60, // Max 60 detections per minute
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
        log.warn('Impossible travel - user not found', { userId });
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
        log.warn('Impossible travel - insufficient permissions', { 
          userId, 
          role: user.role 
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }

    // Get all active sessions with user info, ordered by creation time
    const sessions = await prisma.session.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 500, // Limit to recent sessions for performance
    });

    // Group sessions by user
    const sessionsByUser = new Map<string, typeof sessions>();
    for (const session of sessions) {
      const userId = session.userId;
      if (!sessionsByUser.has(userId)) {
        sessionsByUser.set(userId, []);
      }
      sessionsByUser.get(userId)!.push(session);
    }

    // Detect impossible travel for each user
    const alerts: ImpossibleTravelAlert[] = [];
    
    for (const [_userId, userSessions] of sessionsByUser) {
      // Sort by creation time (oldest first)
      const sortedSessions = userSessions.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      // Compare consecutive sessions
      for (let i = 1; i < sortedSessions.length; i++) {
        const prevSession = sortedSessions[i - 1];
        const currSession = sortedSessions[i];

        // TypeScript safety: ensure sessions exist
        if (!prevSession || !currSession) {
          continue;
        }

        // Skip if either session doesn't have IP address
        if (!prevSession.ipAddress || !currSession.ipAddress) {
          continue;
        }

        // Skip if same IP
        if (prevSession.ipAddress === currSession.ipAddress) {
          continue;
        }

        // Detect impossible travel
        const travelAnalysis = await detectImpossibleTravel(
          {
            ip: prevSession.ipAddress,
            timestamp: prevSession.createdAt,
          },
          {
            ip: currSession.ipAddress,
            timestamp: currSession.createdAt,
          }
        );

        // If impossible travel detected, create an alert
        if (travelAnalysis.isImpossible) {
          alerts.push({
            id: `alert-${currSession.id}`,
            userId: currSession.userId,
            userName: currSession.user.name,
            userEmail: currSession.user.email,
            previousLocation: {
              city: 'Unknown', // GeoIP city info not available in current implementation
              country: '??',
              ip: prevSession.ipAddress,
            },
            currentLocation: {
              city: 'Unknown',
              country: '??',
              ip: currSession.ipAddress,
            },
            distance: travelAnalysis.distance || 0,
            timeDiff: travelAnalysis.timeDiff || 0,
            requiredSpeed: travelAnalysis.requiredSpeed || 0,
            timestamp: currSession.createdAt,
            status: 'pending',
          });
        }
      }
    }

      // Sort alerts by severity (highest speed required first)
      alerts.sort((a, b) => b.requiredSpeed - a.requiredSpeed);

      const duration = Date.now() - startTime;

      // Performance: Log slow detection
      if (duration > 3000) {
        log.warn('Slow impossible travel detection', { userId, duration });
      }

      log.info('Impossible travel detected', { 
        userId, 
        duration, 
        alertCount: alerts.length 
      });

      return NextResponse.json(alerts, {
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Impossible travel detection failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return NextResponse.json(
        { error: 'Failed to detect impossible travel' },
        { status: 500 }
      );
    }
  }
);

