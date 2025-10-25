import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revokeSession, updateSessionName } from "@/lib/session-manager";

export const runtime = "nodejs";

/**
 * PATCH /api/user/sessions/[id]
 * Update session (e.g., rename device)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15+)
    const { id } = await params;
    const { deviceName } = await req.json();

    if (!deviceName || typeof deviceName !== "string") {
      return NextResponse.json({ error: "Device name is required" }, { status: 400 });
    }

    // Verify session belongs to user
    const targetSession = await prisma.session.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await updateSessionName(id, deviceName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Session updated successfully" });
  } catch (error) {
    console.error("[Session PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/sessions/[id]
 * Revoke a specific session
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params (Next.js 15+)
    const { id } = await params;

    // Verify session belongs to user
    const targetSession = await prisma.session.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await revokeSession(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("[Session DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}

