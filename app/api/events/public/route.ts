import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-keys";

export const runtime = "nodejs";

/**
 * GET /api/events/public
 * Public endpoint to list events
 * 
 * Authentication: Requires API key with 'public:read' or 'events:read' scope
 * Rate limit: Based on API key settings (default: 100 req/min)
 * 
 * Query params:
 * - status: Filter by status (Published, Scheduled, Draft)
 * - category: Filter by category
 * - limit: Max results (default: 50, max: 100)
 * - cursor: Pagination cursor (event ID)
 */
export async function GET(req: Request) {
  try {
    // Require API key with appropriate scope
    const auth = await requireApiKey(req, "public:read");
    
    if (!auth.authorized) {
      console.log("[Public Events API] Auth failed:", auth.error);
      return NextResponse.json(
        { error: auth.error },
        { 
          status: auth.status,
          headers: {
            "X-RateLimit-Remaining": "0",
          }
        }
      );
    }
    
    console.log("[Public Events API] Auth successful:", auth.apiKey.name);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const cursor = searchParams.get("cursor");

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    } else {
      // By default, only show Published events for public API
      where.status = "Published";
    }
    
    if (category) {
      where.category = category;
    }

    // Fetch events
    const events = await prisma.event.findMany({
      where,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        world: true,
        shortDescription: true,
        details: true,
        category: true,
        startAt: true,
        endAt: true,
        status: true,
        timezone: true,
        // Recurrence information
        recurrenceFreq: true,
        byWeekdayJson: true, // Days of week for recurring events (e.g., ["MO","WE","FR"])
        timesJson: true,      // Show times for recurring events (e.g., ["15:00","18:00","21:00"])
        recurrenceUntil: true, // End date for recurring events
        createdAt: true,
        updatedAt: true,
      },
    });

    const nextCursor = events.length === limit ? events[events.length - 1]?.id : null;

    return NextResponse.json({
      events,
      pagination: {
        nextCursor,
        limit,
      },
      meta: {
        count: events.length,
        apiKeyName: auth.apiKey.name,
      },
    });
  } catch (error) {
    console.error("[Public Events API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

