import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventStatus } from "@prisma/client";
import { expandEventOccurrences } from "@/lib/recurrence";
import { addDays } from "date-fns";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300; // ISR: Revalidate every 5 minutes

// Security: Constants
const MIN_DAYS = 1;
const MAX_DAYS = 90; // Increased from 60 for more flexibility
const DEFAULT_DAYS = 14;
const MIN_LIMIT = 1;
const MAX_LIMIT = 500; // Reduced from 1000 for performance
const DEFAULT_LIMIT = 200;
const MAX_DB_EVENTS = 500; // Limit database query size

/**
 * Security: Validate number parameter
 */
function validateNumber(value: string | null, min: number, max: number, defaultValue: number): number {
    if (!value) return defaultValue;
    
    const parsed = Number(value);
    
    // Check if valid number
    if (isNaN(parsed) || !isFinite(parsed)) return defaultValue;
    
    // Clamp to valid range
    return Math.max(min, Math.min(parsed, max));
}

/**
 * GET /api/events/public/upcoming
 * 
 * Returns upcoming event occurrences within a date range.
 * Handles recurring events by expanding them into individual occurrences.
 * 
 * Query parameters:
 * - days: Look-ahead window in days (default: 14, min: 1, max: 90)
 * - limit: Max number of occurrences to return (default: 200, max: 500)
 * 
 * Security: Public endpoint (no auth required)
 * Performance: Cached (5min ISR), optimized queries, limited result sets
 * 
 * Use cases:
 * - Event calendar/schedule display
 * - "What's coming up?" widgets
 * - Event planning tools
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Security: Validate query parameters
        const days = validateNumber(searchParams.get("days"), MIN_DAYS, MAX_DAYS, DEFAULT_DAYS);
        const limit = validateNumber(searchParams.get("limit"), MIN_LIMIT, MAX_LIMIT, DEFAULT_LIMIT);

        // Performance: Calculate date range once
        const now = new Date();
        const until = addDays(now, days);

        // Performance: Optimized query with indexed fields and selective fetching
        // Only fetch events that could have occurrences in our date range
        const events = await prisma.event.findMany({
            where: { 
                status: EventStatus.Published,
                // Performance: Only get events that end after now (potential upcoming occurrences)
                endAt: { gte: now },
            },
            orderBy: { startAt: "asc" },
            take: MAX_DB_EVENTS, // Security: Limit database query size
            // Performance: Only select fields needed for expansion
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
                createdAt: true,
                updatedAt: true,
            },
        });

        // Performance: Early return if no events
        if (events.length === 0) {
            return NextResponse.json(
                { items: [] },
                {
                    headers: {
                        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                        "Content-Type": "application/json; charset=utf-8",
                        "X-Content-Type-Options": "nosniff",
                    },
                }
            );
        }

        // Expand recurring events into individual occurrences
        let occurrences = events.flatMap((ev) => 
            expandEventOccurrences(ev, now, until, limit)
        );

        // Sort by start time and apply limit
        occurrences = occurrences
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, limit);

        return NextResponse.json(
            { 
                items: occurrences,
                // Include metadata for client
                meta: {
                    count: occurrences.length,
                    days,
                    limit,
                    from: now.toISOString(),
                    until: until.toISOString(),
                },
            },
            {
                headers: {
                    // Performance: Cache for 5 minutes with stale-while-revalidate
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
    } catch (e) {
        console.error("[Upcoming Events API] GET failed:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to load upcoming events" },
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
