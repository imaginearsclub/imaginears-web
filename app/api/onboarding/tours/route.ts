import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getTourRecommendations, tours } from "@/lib/onboarding";

/**
 * GET /api/onboarding/tours
 * Get available tours and recommendations
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

    const recommendations = await getTourRecommendations(session.user.id, user.role);

    return NextResponse.json({
      allTours: Object.values(tours),
      recommendations,
    });
  } catch (error: any) {
    console.error("[Onboarding] Error fetching tours:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tours" },
      { status: 500 }
    );
  }
}

