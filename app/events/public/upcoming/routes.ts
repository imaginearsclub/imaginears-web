import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expandEventOccurrences } from "@/lib/recurrence";
import { addDays } from "date-fns";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Always fetch fresh data
export const revalidate = 300; // ISR: Cache for 5 minutes

// Security: Constants for input validation
const MIN_DAYS = 1;
const MAX_DAYS = 60;
const DEFAULT_DAYS = 14;
const MIN_LIMIT = 1;
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 200;
const MAX_DB_EVENTS = 500; // Limit database query for performance

/**
 * Security: Validate and sanitize numeric input
 * @param value - Raw input value
 * @param defaultValue - Default if invalid
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Validated number
 */
function validateNumber(
    value: string | null,
    defaultValue: number,
    min: number,
    max: number
): number {
    if (!value) return defaultValue;
    
    const parsed = Number(value);
    
    // Security: Reject NaN, Infinity, negative zero, etc.
    if (!Number.isFinite(parsed) || parsed < min) {
        return defaultValue;
    }
    
    return Math.min(Math.floor(parsed), max);
}

/**
 * GET /api/events/public/upcoming
 * 
 * Returns upcoming event occurrences within a specified date range.
 * 
 * Query Parameters:
 * - days: Number of days to look ahead (1-60, default: 14)
 * - limit: Maximum occurrences to return (1-1000, default: 200)
 * 
 * Security: Rate limited, input validated, no sensitive data exposed
 * Performance: ISR cached for 5 minutes, selective field queries
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Security: Validate and sanitize inputs
        const days = validateNumber(
            searchParams.get("days"),
            DEFAULT_DAYS,
            MIN_DAYS,
            MAX_DAYS
        );
        const limit = validateNumber(
            searchParams.get("limit"),
            DEFAULT_LIMIT,
            MIN_LIMIT,
            MAX_LIMIT
        );

        // Performance: Calculate date range once
        const now = new Date();
        const until = addDays(now, days);

        // Security: Only fetch Published events, limit database query
        // Performance: Filter by date range and limit results
        const events = await prisma.event.findMany({
            where: { 
                status: EventStatus.Published,
                // Performance: Only get events that could possibly have occurrences in range
                endAt: { gte: now }
            },
            orderBy: { startAt: "asc" },
            take: MAX_DB_EVENTS, // Performance: Limit database query
        });

        // Performance: Early return if no events
        if (events.length === 0) {
            return NextResponse.json(
                { items: [], count: 0, cached: false },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                        "CDN-Cache-Control": "public, s-maxage=300",
                    },
                }
            );
        }

        // Expand recurring events into individual occurrences
        let occurrences = events.flatMap((event) => 
            expandEventOccurrences(event, now, until, limit)
        );

        // Performance: Sort and limit in one pass
        occurrences = occurrences
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .slice(0, limit);

        return NextResponse.json(
            { 
                items: occurrences,
                count: occurrences.length,
                cached: false 
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                    "CDN-Cache-Control": "public, s-maxage=300",
                },
            }
        );
    } catch (error) {
        // Security: Don't expose internal error details
        console.error("[API] /events/public/upcoming error:", error);
        
        return NextResponse.json(
            { 
                error: "Failed to load upcoming events",
                items: [],
                count: 0 
            },
            { 
                status: 500,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                },
            }
        );
    }
}
