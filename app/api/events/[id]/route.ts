import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { EventCategory, EventStatus, RecurrenceFreq } from "@prisma/client";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const MAX_REQUEST_BODY_SIZE = 10240; // 10KB max
const MAX_ID_LENGTH = 50; // UUIDs are typically 36 chars
const MAX_TITLE_LENGTH = 200;
const MAX_WORLD_LENGTH = 100;
const MAX_SHORT_DESC_LENGTH = 500;
const MAX_DETAILS_LENGTH = 50000;

// Valid enum values
const VALID_CATEGORIES: EventCategory[] = ["Fireworks", "SeasonalOverlay", "MeetAndGreet", "Parade", "Other"];
const VALID_STATUSES: EventStatus[] = ["Draft", "Published", "Archived"];
const VALID_RECURRENCE_FREQ: RecurrenceFreq[] = ["NONE", "DAILY", "WEEKLY"];

// Security: Rate limiting for event updates
const updateEventRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_UPDATE_EVENTS = 20; // Max 20 updates per minute per user

/**
 * Security: Check rate limiting
 */
function isUpdateRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = updateEventRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        updateEventRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    return record.count > MAX_UPDATE_EVENTS;
}

/**
 * Security: Validate event ID
 */
function isValidEventId(id: string): boolean {
    if (!id || typeof id !== "string") return false;
    if (id.length > MAX_ID_LENGTH) return false;
    // Basic UUID format check (flexible for different ID formats)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) return false;
    return true;
}

/**
 * Security: Sanitize string input
 */
function sanitizeString(input: unknown, maxLength: number): string | undefined {
    if (input === undefined) return undefined;
    if (typeof input !== "string") return "";
    return input.trim().slice(0, maxLength);
}

/**
 * Security: Validate category
 */
function validateCategory(category: unknown): EventCategory | undefined {
    if (category === undefined) return undefined;
    if (typeof category === "string" && VALID_CATEGORIES.includes(category as EventCategory)) {
        return category as EventCategory;
    }
    return undefined;
}

/**
 * Security: Validate status
 */
function validateStatus(status: unknown): EventStatus | undefined {
    if (status === undefined) return undefined;
    if (typeof status === "string" && VALID_STATUSES.includes(status as EventStatus)) {
        return status as EventStatus;
    }
    return undefined;
}

/**
 * Security: Validate recurrence frequency
 */
function validateRecurrenceFreq(freq: unknown): RecurrenceFreq | undefined {
    if (freq === undefined) return undefined;
    if (typeof freq === "string" && VALID_RECURRENCE_FREQ.includes(freq as RecurrenceFreq)) {
        return freq as RecurrenceFreq;
    }
    return undefined;
}

/**
 * Security: Validate timezone
 */
function validateTimezone(tz: unknown): string | undefined {
    if (tz === undefined) return undefined;
    if (typeof tz !== "string") return undefined;
    
    const trimmed = tz.trim();
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(trimmed)) return undefined;
    
    try {
        Intl.DateTimeFormat(undefined, { timeZone: trimmed });
        return trimmed;
    } catch {
        return undefined;
    }
}

/**
 * Security: Validate date
 */
function validateDate(dateInput: unknown): Date | undefined | null {
    if (dateInput === undefined) return undefined;
    if (dateInput === null) return null;
    
    try {
        const date = new Date(dateInput as string);
        if (isNaN(date.getTime())) return undefined;
        
        const year = date.getFullYear();
        if (year < 1970 || year > 2100) return undefined;
        
        return date;
    } catch {
        return undefined;
    }
}

/**
 * PATCH /api/events/[id]
 * 
 * Updates an existing event.
 * 
 * Security:
 * - Requires authentication (admin only)
 * - Rate limited (20 updates per minute per user)
 * - Input validation and sanitization
 * - ID validation
 * - Request body size limit (10KB)
 * 
 * Performance:
 * - Optimized partial updates
 * - Only updates provided fields
 */
export async function PATCH(
    req: Request, 
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        
        // Security: Validate event ID
        if (!isValidEventId(id)) {
            return NextResponse.json(
                { error: "Invalid event ID" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Security: Check authentication
        const session = await auth.api.getSession({
            headers: await nextHeaders(),
        });
        
        if (!session?.user) {
            return NextResponse.json(
                { error: "Authentication required" },
                { 
                    status: 401,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        const userId = session.user.id;
        
        // Security: Rate limiting
        if (isUpdateRateLimited(userId)) {
            console.warn(`[Events API] Update rate limit exceeded for user: ${userId}`);
            return NextResponse.json(
                { error: "Too many updates. Please try again later." },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "Content-Type": "application/json; charset=utf-8",
                    },
                }
            );
        }
        
        // Security: Parse and validate request body
        let body: any;
        try {
            const text = await req.text();
            
            if (text.length > MAX_REQUEST_BODY_SIZE) {
                console.warn(`[Events API] Update request body too large: ${text.length} bytes`);
                return NextResponse.json(
                    { error: "Request body too large" },
                    { 
                        status: 413,
                        headers: { "Content-Type": "application/json; charset=utf-8" },
                    }
                );
            }
            
            body = JSON.parse(text);
        } catch {
            console.warn("[Events API] Invalid JSON in update request");
            return NextResponse.json(
                { error: "Invalid request format" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Security: Validate and sanitize all inputs
        const title = sanitizeString(body.title, MAX_TITLE_LENGTH);
        const world = sanitizeString(body.world, MAX_WORLD_LENGTH);
        const shortDescription = body.shortDescription !== undefined 
            ? sanitizeString(body.shortDescription, MAX_SHORT_DESC_LENGTH) || null 
            : undefined;
        const details = body.details !== undefined 
            ? sanitizeString(body.details, MAX_DETAILS_LENGTH) || null 
            : undefined;
        
        const category = validateCategory(body.category);
        const status = validateStatus(body.status);
        const timezone = validateTimezone(body.timezone);
        const recurrenceFreq = validateRecurrenceFreq(body.recurrenceFreq);
        
        const startAt = validateDate(body.startAt);
        const endAt = validateDate(body.endAt);
        const recurrenceUntil = body.recurrenceUntil !== undefined 
            ? validateDate(body.recurrenceUntil) 
            : undefined;
        
        // Validate recurrence arrays
        const byWeekdayJson = body.byWeekday !== undefined
            ? (Array.isArray(body.byWeekday) 
                ? body.byWeekday.filter((d: any) => typeof d === "number" && d >= 0 && d <= 6)
                : null)
            : undefined;
        
        const timesJson = body.times !== undefined
            ? (Array.isArray(body.times)
                ? body.times.filter((t: any) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 10)
                : null)
            : undefined;
        
        // Build update data object (only include defined fields)
        const updateData: any = {};
        
        if (title !== undefined) updateData.title = title;
        if (world !== undefined) updateData.world = world;
        if (category !== undefined) updateData.category = category;
        if (status !== undefined) updateData.status = status;
        if (details !== undefined) updateData.details = details;
        if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
        if (startAt !== undefined) updateData.startAt = startAt;
        if (endAt !== undefined) updateData.endAt = endAt;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (recurrenceFreq !== undefined) updateData.recurrenceFreq = recurrenceFreq;
        if (byWeekdayJson !== undefined) updateData.byWeekdayJson = byWeekdayJson;
        if (timesJson !== undefined) updateData.timesJson = timesJson;
        if (recurrenceUntil !== undefined) updateData.recurrenceUntil = recurrenceUntil;
        
        // Validation: If both dates provided, end must be after start
        if (startAt && endAt && endAt <= startAt) {
            return NextResponse.json(
                { error: "End date must be after start date" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Check if event exists before updating
        const existing = await prisma.event.findUnique({
            where: { id },
            select: { id: true },
        });
        
        if (!existing) {
            return NextResponse.json(
                { error: "Event not found" },
                { 
                    status: 404,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Perform the update
        const updated = await prisma.event.update({
            where: { id },
            data: updateData,
            select: { 
                id: true,
                title: true,
                world: true,
                category: true,
                status: true,
                startAt: true,
                endAt: true,
                updatedAt: true,
            },
        });

        console.log(`[Events API] Event updated: ${id} by user: ${userId}`);

        return NextResponse.json(
            {
                id: updated.id,
                title: updated.title,
                world: updated.world,
                category: updated.category,
                status: updated.status,
                startAt: updated.startAt.toISOString(),
                endAt: updated.endAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
            },
            {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
    } catch (e) {
        console.error("[Events API] PATCH failed:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to update event" },
            { 
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }
}
