import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revokeAllSessions } from "@/lib/session-manager";

export const runtime = "nodejs";

/**
 * GET /api/user/sessions
 * Get all sessions for the current user
 */
export async function GET() {
  try {
    const session = await requirePermission("sessions:view_own");
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Forbidden: Missing permission 'sessions:view_own'" },
        { status: 403 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        token: true,
        deviceName: true,
        deviceType: true,
        browser: true,
        os: true,
        country: true,
        city: true,
        trustLevel: true,
        isSuspicious: true,
        lastActivityAt: true,
        isRememberMe: true,
        loginMethod: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { lastActivityAt: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("[Sessions GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/sessions
 * Revoke all sessions except the current one
 */
export async function DELETE() {
  try {
    const session = await requirePermission("sessions:revoke_own");
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Forbidden: Missing permission 'sessions:revoke_own'" },
        { status: 403 }
      );
    }

    const result = await revokeAllSessions(session.user.id, session.session?.token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "All other sessions revoked successfully",
      count: result.count 
    });
  } catch (error) {
    console.error("[Sessions DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 });
  }
}

