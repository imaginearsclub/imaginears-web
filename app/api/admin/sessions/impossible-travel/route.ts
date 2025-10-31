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
import { detectImpossibleTravel, getLocationFromIP } from '@/lib/geolocation';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../utils';
import { jsonOk, jsonError } from '../response';

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

async function authorizeViewAnalytics(userId: string): Promise<'ok' | NextResponse> {
  const has = await checkSessionsPermission(userId, SESSIONS_PERMISSIONS.VIEW_ANALYTICS);
  if (!has) {
    log.warn('Impossible travel - insufficient permissions', { userId });
    return jsonError(new Request(''), 'Forbidden: Insufficient permissions', 403);
  }
  return 'ok';
}

async function buildImpossibleTravelAlerts(): Promise<ImpossibleTravelAlert[]> {
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
    const uid = session.userId;
    if (!sessionsByUser.has(uid)) {
      sessionsByUser.set(uid, []);
    }
    sessionsByUser.get(uid)!.push(session);
  }

  // Detect impossible travel for each user
  const alerts: ImpossibleTravelAlert[] = [];

  for (const userSessions of sessionsByUser.values()) {
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
        // Enrich with GeoIP city/country (best-effort, do not fail the alert)
        const [prevLoc, currLoc] = await Promise.all([
          getLocationFromIP(prevSession.ipAddress).catch(() => null),
          getLocationFromIP(currSession.ipAddress).catch(() => null),
        ]);

        alerts.push({
          id: `alert-${currSession.id}`,
          userId: currSession.userId,
          userName: currSession.user.name,
          userEmail: currSession.user.email,
          previousLocation: {
            city: prevLoc?.city || 'Unknown',
            country: prevLoc?.country || '??',
            ip: prevSession.ipAddress,
          },
          currentLocation: {
            city: currLoc?.city || 'Unknown',
            country: currLoc?.country || '??',
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
  return alerts;
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
      const auth = await authorizeViewAnalytics(userId!);
      if (auth !== 'ok') {
        return auth;
      }

      const alerts = await buildImpossibleTravelAlerts();

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

      return jsonOk(_req, alerts, { headers: { 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Impossible travel detection failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to detect impossible travel', 500);
    }
  }
);

