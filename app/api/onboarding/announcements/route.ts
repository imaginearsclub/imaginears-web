import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getActiveAnnouncements } from "@/lib/onboarding";

/**
 * GET /api/onboarding/announcements
 * Get active announcements for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const announcements = await getActiveAnnouncements(user.role, session.user.id);

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error("[Onboarding] Error fetching announcements:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

