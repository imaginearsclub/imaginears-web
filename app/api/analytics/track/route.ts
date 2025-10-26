import { NextRequest, NextResponse } from "next/server";
import { trackEvent, trackPageView } from "@/lib/analytics";
import { getServerSession } from "@/lib/session";

/**
 * POST /api/analytics/track
 * 
 * Track analytics events (page views, actions, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getServerSession();

    const { type, ...data } = body;

    // Get session and device info
    const referrer = req.headers.get("referer");

    // Track based on event type
    if (type === "page_view") {
      await trackPageView({
        path: data.path,
        ...(session?.user?.id && { userId: session.user.id }),
        ...(session?.session?.id && { sessionId: session.session.id }),
        ...(referrer && { referrer }),
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        duration: data.duration,
      });
    } else {
      await trackEvent({
        eventType: type,
        eventName: data.eventName || type,
        ...(session?.user?.id && { userId: session.user.id }),
        ...(session?.session?.id && { sessionId: session.session.id }),
        path: data.path,
        ...(referrer && { referrer }),
        deviceType: data.deviceType,
        browser: data.browser,
        os: data.os,
        properties: data.properties,
        duration: data.duration,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics API] Track error:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

