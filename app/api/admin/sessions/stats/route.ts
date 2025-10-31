/**
 * Session Statistics API
 * 
 * GET /api/admin/sessions/stats
 * Returns real-time session statistics and user session data
 * 
 * Security: Requires sessions:view_all permission, rate limited
 * Performance: Parallel queries, efficient aggregations
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';
import { createApiHandler } from '@/lib/api-middleware';
import { log } from '@/lib/logger';
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from '../utils';
import crypto from 'node:crypto';
import { jsonOk, jsonError } from '../response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache for 15 seconds
const CACHE_SECONDS = 15;

/**
 * GET /api/admin/sessions/stats
 * 
 * Returns real-time session statistics and user risk scores
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: Parallel queries, efficient grouping
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sessions:stats',
      limit: 120, // Allow frequent stats checks
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    return await Sentry.startSpan(
      {
        op: 'db.query',
        name: 'Fetch Session Statistics',
      },
      async (span) => {
        const startTime = Date.now();

        try {
          // RBAC: Check sessions:view_all permission
          if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.VIEW_ALL))) {
            return NextResponse.json(
              { error: 'Forbidden: Insufficient permissions' },
              { status: 403 }
            );
          }

    // Get active sessions count
    const activeSessions = await prisma.session.count({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    // Get suspicious sessions count (flagged sessions)
    const suspiciousSessions = await prisma.session.count({
      where: {
        expiresAt: { gt: new Date() },
        isSuspicious: true,
      },
    });

    // Get unique active users
    const uniqueActiveUsers = await prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Get all users with session data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sessions: {
          where: {
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            isSuspicious: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform user data with session stats
    const usersWithStats = users.map((user) => {
      const activeSessions = user.sessions.length;
      const suspiciousSessions = user.sessions.filter((s) => s.isSuspicious).length;
      
      // Simple risk score calculation
      // Base: 0
      // +30 for each suspicious session
      // +10 for each additional session over 3
      const riskScore = Math.min(
        100,
        suspiciousSessions * 30 + Math.max(0, activeSessions - 3) * 10
      );

      const lastLogin = user.sessions.length > 0
        ? user.sessions.reduce((latest, session) => {
            return new Date(session.createdAt) > new Date(latest)
              ? session.createdAt
              : latest;
          }, user.sessions[0]!.createdAt)
        : null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        activeSessions,
        suspiciousSessions,
        riskScore,
        lastLogin,
      };
    });

          const duration = Date.now() - startTime;

          // Add performance metrics to span
          span.setAttribute('activeSessions', activeSessions);
          span.setAttribute('suspiciousSessions', suspiciousSessions);
          span.setAttribute('activeUsers', uniqueActiveUsers.length);
          span.setAttribute('totalUsers', usersWithStats.length);
          span.setAttribute('duration', duration);

          // Performance: Log slow operations
          if (duration > 2000) {
            log.warn('Slow session stats query', { userId, duration });
          }

          log.info('Session stats fetched', { 
            userId, 
            duration,
            activeSessions,
            totalUsers: usersWithStats.length
          });

          const payload = {
            stats: {
              activeSessions,
              suspiciousSessions,
              activeUsers: uniqueActiveUsers.length,
            },
            users: usersWithStats,
          };
          const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
          const etag = `W/"${hash}"`;
          const ifNoneMatch = _req.headers.get('if-none-match');
          if (ifNoneMatch && ifNoneMatch === etag) {
            return new NextResponse(null, {
              status: 304,
              headers: {
                'ETag': etag,
                'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
              },
            });
          }

          return jsonOk(_req, payload, {
            headers: {
              'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
              'X-Response-Time': `${duration}ms`,
              'ETag': etag,
            },
          });
        } catch (error) {
          const duration = Date.now() - startTime;

          // Capture error in Sentry with context
          Sentry.captureException(error, {
            tags: {
              api_route: '/api/admin/sessions/stats',
            },
          });

          log.error('Session stats fetch failed', {
            userId,
            duration,
            error: error instanceof Error ? error.message : String(error),
          });

          // Security: Generic error message
          return jsonError(_req, 'Failed to fetch session statistics', 500);
        }
      }
    );
  }
);

