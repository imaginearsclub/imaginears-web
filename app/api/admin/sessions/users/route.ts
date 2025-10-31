/**
 * Session Users API
 * 
 * GET /api/admin/sessions/users
 * Returns all users with their active session statistics
 * 
 * Security: Requires sessions:view_all permission, rate limited
 * Performance: Efficient grouping, 15-second cache
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from "../utils";
import { jsonOk, jsonError } from "../response";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 15 seconds
const CACHE_SECONDS = 15;

function buildUserMap(activeSessions: Array<{ id: string; userId: string; isSuspicious: boolean; createdAt: Date; user: { id: string; name: string | null; email: string | null; role: string; } }>) {
  const userMap = new Map<string, {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    sessions: typeof activeSessions;
  }>();

  activeSessions.forEach(sess => {
    if (!userMap.has(sess.userId)) {
      userMap.set(sess.userId, {
        id: sess.user.id,
        name: sess.user.name,
        email: sess.user.email,
        role: sess.user.role,
        sessions: [],
      });
    }
    userMap.get(sess.userId)!.sessions.push(sess);
  });

  return userMap;
}

function transformUsers(userMap: Map<string, {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  sessions: Array<{ id: string; userId: string; isSuspicious: boolean; createdAt: Date; user: { id: string; name: string | null; email: string | null; role: string; } }>;
}>) {
  const usersWithStats = Array.from(userMap.values()).map(u => {
    const activeSessions = u.sessions.length;
    const suspiciousSessions = u.sessions.filter(s => s.isSuspicious).length;
    const avgRiskScore = suspiciousSessions > 0 ? Math.min(suspiciousSessions * 20, 100) : 0;
    const sortedSessions = [...u.sessions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastLogin = sortedSessions[0]?.createdAt || null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      activeSessions,
      suspiciousSessions,
      riskScore: avgRiskScore,
      lastLogin,
    };
  });

  return usersWithStats;
}

/**
 * GET /api/admin/sessions/users
 * 
 * Returns all users with session statistics and risk scores
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: Efficient queries, minimal data transfer
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "sessions:users",
      limit: 120, // Allow frequent checks
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // RBAC
      if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.VIEW_ALL))) {
        return jsonError(_req, "Forbidden: Missing permission 'sessions:view_all'", 403);
      }

    const now = new Date();

    // Get all active sessions with user info
    const activeSessions = await prisma.session.findMany({
      where: { expiresAt: { gt: now } },
      select: {
        id: true,
        userId: true,
        isSuspicious: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const userMap = buildUserMap(activeSessions);
    const usersWithStats = transformUsers(userMap);

      const duration = Date.now() - startTime;

      // Performance: Log slow operations
      if (duration > 2000) {
        log.warn("Slow session users query", { userId, duration });
      }

      log.info("Session users fetched", {
        userId,
        duration,
        total: usersWithStats.length,
      });

      const payload = {
        users: usersWithStats,
        total: usersWithStats.length,
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

      log.error("Session users fetch failed", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // Security: Generic error message
      return jsonError(_req, "Failed to fetch users", 500);
    }
  }
);

