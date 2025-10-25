import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Require session viewing permission
    const session = await requirePermission("sessions:view_all");
    if (!session) {
      return NextResponse.json(
        { error: "Forbidden: Missing permission 'sessions:view_all'" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Get all active sessions with user info
    const activeSessions = await prisma.session.findMany({
      where: {
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        userId: true,
        isSuspicious: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Group sessions by user
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

    // Transform data
    const usersWithStats = Array.from(userMap.values()).map(u => {
      const activeSessions = u.sessions.length;
      const suspiciousSessions = u.sessions.filter(s => s.isSuspicious).length;
      // Note: riskScore is not yet in schema, so we'll calculate a simple one
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

    return NextResponse.json({
      users: usersWithStats,
      total: usersWithStats.length,
    });
  } catch (error) {
    console.error("Error fetching admin session users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

