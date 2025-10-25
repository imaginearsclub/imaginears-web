import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { enhanceExistingSession } from "@/lib/enhance-session";

export const runtime = "nodejs";

/**
 * POST /api/user/sessions/enhance
 * Manually enhance current session with tracking data
 */
export async function POST() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id || !session?.session?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enhance the current session
    const enhanced = await enhanceExistingSession(session.session.token);

    if (!enhanced) {
      return NextResponse.json({ error: "Failed to enhance session" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Session enhanced successfully",
      enhanced: true,
    });
  } catch (error) {
    console.error("[Session Enhance] Error:", error);
    return NextResponse.json({ error: "Failed to enhance session" }, { status: 500 });
  }
}

