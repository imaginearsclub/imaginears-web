import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { getUserSessionAnalytics } from "@/lib/session-manager";

export const runtime = "nodejs";

/**
 * GET /api/user/sessions/analytics
 * Get session analytics and activity logs for current user
 */
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getUserSessionAnalytics(session.user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[Session Analytics GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

