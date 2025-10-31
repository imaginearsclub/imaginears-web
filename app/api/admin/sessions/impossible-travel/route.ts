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
import { sanitizeForDisplay, normalizeEmail } from '@/lib/input-sanitization';
import { isIP } from 'node:net';

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
  distance: number; // km (legacy)
  distanceKm: number; // km
  distanceMi: number; // miles
  timeDiff: number;
  requiredSpeed: number;
  timestamp: Date;
  status: 'pending' | 'dismissed' | 'blocked';
  preferredUnit?: 'km' | 'mi';
}

async function authorizeViewAnalytics(userId: string): Promise<NextResponse | null> {
  const has = await checkSessionsPermission(userId, SESSIONS_PERMISSIONS.VIEW_ANALYTICS);
  if (!has) {
    log.warn('Impossible travel - insufficient permissions', { userId });
    return jsonError(new Request(''), 'Forbidden: Insufficient permissions', 403);
  }
  return null;
}

function groupSessionsByUser<T extends { userId: string }>(sessions: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const s of sessions) {
    const list = map.get(s.userId) || [];
    list.push(s);
    map.set(s.userId, list);
  }
  return map;
}

function sortSessionsOldestFirst<T extends { createdAt: Date }>(sessions: T[]): T[] {
  return sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function toSessionLite(raw: any): SessionLite | null {
  if (!raw) return null;
  return {
    id: raw.id,
    userId: raw.userId,
    createdAt: raw.createdAt,
    ipAddress: raw.ipAddress,
    userName: sanitizeForDisplay(raw.user?.name ?? null, 80),
    userEmail: normalizeEmail(raw.user?.email ?? null) || null,
  };
}

interface SessionLite {
  id: string;
  userId: string;
  createdAt: Date;
  ipAddress: string | null;
  userName: string | null;
  userEmail: string | null;
}

function isValidIP(ip: string | null): boolean {
  if (!ip) return false;
  return isIP(ip) !== 0;
}

function shouldAnalyzePair(prevSession: SessionLite | null, currSession: SessionLite | null): prevSession is SessionLite & { ipAddress: string } {
  return !!(
    prevSession &&
    currSession &&
    isValidIP(prevSession.ipAddress) &&
    isValidIP(currSession.ipAddress) &&
    prevSession.ipAddress !== currSession.ipAddress
  );
}

function buildAlertObject(
  prevSession: SessionLite,
  currSession: SessionLite,
  prevLoc: { city?: string | null; country?: string | null } | null,
  currLoc: { city?: string | null; country?: string | null } | null,
  analysis: { distance?: number; timeDiff?: number; requiredSpeed?: number }
): ImpossibleTravelAlert {
  const km = analysis.distance || 0;
  const mi = Math.round((km * 0.621371) * 100) / 100;
  return {
    id: `alert-${currSession.id}`,
    userId: currSession.userId,
    userName: currSession.userName,
    userEmail: currSession.userEmail,
    previousLocation: {
      city: prevLoc?.city || 'Unknown',
      country: prevLoc?.country || '??',
      ip: prevSession.ipAddress!,
    },
    currentLocation: {
      city: currLoc?.city || 'Unknown',
      country: currLoc?.country || '??',
      ip: currSession.ipAddress!,
    },
    distance: km,
    distanceKm: km,
    distanceMi: mi,
    timeDiff: analysis.timeDiff || 0,
    requiredSpeed: analysis.requiredSpeed || 0,
    timestamp: currSession.createdAt,
    status: 'pending',
    preferredUnit: 'km',
  };
}

async function maybeBuildAlert(prevSession: SessionLite | null, currSession: SessionLite | null): Promise<ImpossibleTravelAlert | null> {
  if (!shouldAnalyzePair(prevSession, currSession)) return null;
  const prev = prevSession as SessionLite;
  const curr = currSession as SessionLite;

  const travelAnalysis = await detectImpossibleTravel(
    { ip: prev.ipAddress!, timestamp: prev.createdAt },
    { ip: curr.ipAddress!, timestamp: curr.createdAt }
  );

  if (!travelAnalysis.isImpossible) return null;

  const prevLookup = isValidIP(prev.ipAddress) ? getLocationFromIP(prev.ipAddress!).catch(() => null) : Promise.resolve(null);
  const currLookup = isValidIP(curr.ipAddress) ? getLocationFromIP(curr.ipAddress!).catch(() => null) : Promise.resolve(null);
  const [prevLoc, currLoc] = await Promise.all([
    prevLookup,
    currLookup,
  ]);

  return buildAlertObject(prev, curr, prevLoc, currLoc, travelAnalysis);
}

async function buildImpossibleTravelAlerts(): Promise<ImpossibleTravelAlert[]> {
  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const alerts: ImpossibleTravelAlert[] = [];
  const sessionsByUser = groupSessionsByUser(sessions);

  for (const userSessions of sessionsByUser.values()) {
    const sorted = sortSessionsOldestFirst(userSessions);
    for (let i = 1; i < sorted.length; i++) {
      const prev = toSessionLite(sorted[i - 1]);
      const curr = toSessionLite(sorted[i]);
      const alert = await maybeBuildAlert(prev, curr);
      if (alert) alerts.push(alert);
    }
  }

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
      const authResp = await authorizeViewAnalytics(userId!);
      if (authResp) {
        return authResp;
      }

      const alerts = await buildImpossibleTravelAlerts();

      // Determine preferred unit: query param > Accept-Language > default km
      const url = new URL(_req.url);
      const qpUnit = url.searchParams.get('unit');
      const acceptLang = _req.headers.get('accept-language') || '';

      const mileCountries = new Set(['US', 'GB', 'LR', 'MM']);

      function inferUnitFromAcceptLanguage(al: string): 'km' | 'mi' {
        // crude parse: look for region tags like en-US, en-GB
        const match = al.match(/-([A-Z]{2})/);
        const region = match?.[1];
        return region && mileCountries.has(region) ? 'mi' : 'km';
      }

      const preferredUnit: 'km' | 'mi' = qpUnit === 'mi' ? 'mi' : qpUnit === 'km' ? 'km' : inferUnitFromAcceptLanguage(acceptLang);

      const alertsWithUnit = alerts.map((a) => ({ ...a, preferredUnit }));

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

      return jsonOk(_req, alertsWithUnit, { headers: { 'X-Response-Time': `${duration}ms`, 'X-Distance-Unit': preferredUnit } });
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

