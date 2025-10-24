import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const MIN_LIMIT = 1;
const MAX_LIMIT = 50; // Increased from 24 for flexibility
const DEFAULT_LIMIT = 3;

/**
 * Security: Validate limit parameter
 */
function validateLimit(limitParam: string | null): number {
    if (!limitParam) return DEFAULT_LIMIT;
    
    const parsed = parseInt(limitParam, 10);
    
    // Check if valid number
    if (isNaN(parsed)) return DEFAULT_LIMIT;
    
    // Clamp to valid range
    return Math.max(MIN_LIMIT, Math.min(parsed, MAX_LIMIT));
}

/**
 * GET /api/events/running
 * 
 * Returns currently running (active) events.
 * An event is considered "running" if:
 * - Status is "Published"
 * - Current time is between startAt and endAt
 * 
 * Query parameters:
 * - limit: Number of events to return (default: 3, max: 50)
 * 
 * Security: Public endpoint (no auth required)
 * Performance: Cached, optimized query with indexed fields
 * 
 * Use cases:
 * - "What's happening now?" widget
 * - Active events banner
 * - Live event notifications
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Security: Validate limit parameter
        const limit = validateLimit(searchParams.get("limit"));
        
        // Performance: Use current timestamp once
        const now = new Date();

        // Performance: Optimized query with indexed fields (status, startAt, endAt)
        const rows = await prisma.event.findMany({
            where: {
                status: "Published",
                startAt: { lte: now },
                endAt: { gte: now },
            },
            orderBy: [{ endAt: "asc" }], // Ending soonest first
            take: limit,
            // Performance: Only select needed fields
            select: {
                id: true,
                title: true,
                world: true,
                category: true,
                status: true,
                startAt: true,
                endAt: true,
                timezone: true,
                shortDescription: true,
                details: true,
                recurrenceFreq: true,
                byWeekdayJson: true,
                timesJson: true,
                recurrenceUntil: true,
            },
        });

        // Performance: Early return if no events
        if (rows.length === 0) {
            return NextResponse.json(
                [],
                {
                    headers: {
                        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
                        "Content-Type": "application/json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                    },
                }
            );
        }

        // Serialize dates to ISO for client
        const items = rows.map((e) => ({
            ...e,
            startAt: e.startAt.toISOString(),
            endAt: e.endAt.toISOString(),
            // Serialize recurrenceUntil if it exists
            recurrenceUntil: e.recurrenceUntil?.toISOString() ?? null,
        }));

        return NextResponse.json(items, {
            headers: {
                // Performance: Cache for 30 seconds (events are "running" in real-time)
                "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e) {
        console.error("[Running Events API] GET failed:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to load running events" },
            { 
                status: 500,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
    }
}
