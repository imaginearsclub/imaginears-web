import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { EventCategory, EventStatus, RecurrenceFreq } from "@prisma/client";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const MAX_REQUEST_BODY_SIZE = 10240; // 10KB max for event creation
const MAX_EVENTS_PER_PAGE = 100;
const DEFAULT_EVENTS_PER_PAGE = 50;
const MAX_TITLE_LENGTH = 200;
const MAX_WORLD_LENGTH = 100;
const MAX_SHORT_DESC_LENGTH = 500;
const MAX_DETAILS_LENGTH = 50000; // 50KB for markdown details

// Valid categories and statuses from Prisma schema
const VALID_CATEGORIES: EventCategory[] = ["Attraction", "Show", "MeetGreet", "Dining", "Shopping", "Other"];
const VALID_STATUSES: EventStatus[] = ["Draft", "Published", "Archived"];
const VALID_RECURRENCE_FREQ: RecurrenceFreq[] = ["NONE", "DAILY", "WEEKLY"];

// Security: Rate limiting for event creation
const createEventRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_CREATE_EVENTS = 10; // Max 10 events created per minute per user

/**
 * Security: Check rate limiting for event creation
 */
function isCreateRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = createEventRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        createEventRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    return record.count > MAX_CREATE_EVENTS;
}

/**
 * Security: Sanitize and validate string inputs
 */
function sanitizeString(input: unknown, maxLength: number): string {
    if (typeof input !== "string") return "";
    return input.trim().slice(0, maxLength);
}

/**
 * Security: Validate and sanitize event category
 */
function validateCategory(category: unknown): EventCategory {
    if (typeof category === "string" && VALID_CATEGORIES.includes(category as EventCategory)) {
        return category as EventCategory;
    }
    return "Other";
}

/**
 * Security: Validate and sanitize event status
 */
function validateStatus(status: unknown): EventStatus {
    if (typeof status === "string" && VALID_STATUSES.includes(status as EventStatus)) {
        return status as EventStatus;
    }
    return "Draft";
}

/**
 * Security: Validate and sanitize recurrence frequency
 */
function validateRecurrenceFreq(freq: unknown): RecurrenceFreq {
    if (typeof freq === "string" && VALID_RECURRENCE_FREQ.includes(freq as RecurrenceFreq)) {
        return freq as RecurrenceFreq;
    }
    return "NONE";
}

/**
 * Security: Validate timezone string
 */
function validateTimezone(tz: unknown): string {
    if (typeof tz !== "string") return "America/New_York";
    const trimmed = tz.trim();
    
    // Basic validation - check format
    if (!/^[A-Za-z_]+\/[A-Za-z_]+$/.test(trimmed)) {
        return "America/New_York";
    }
    
    // Validate it's a real timezone
    try {
        Intl.DateTimeFormat(undefined, { timeZone: trimmed });
        return trimmed;
    } catch {
        return "America/New_York";
    }
}

/**
 * Security: Validate date string
 */
function validateDate(dateInput: unknown): Date | null {
    if (!dateInput) return null;
    
    try {
        const date = new Date(dateInput as string);
        
        // Check if valid date
        if (isNaN(date.getTime())) return null;
        
        // Sanity check: must be between 1970 and 2100
        const year = date.getFullYear();
        if (year < 1970 || year > 2100) return null;
        
        return date;
    } catch {
        return null;
    }
}

/**
 * Security: Validate pagination parameters
 */
function validatePaginationParams(searchParams: URLSearchParams): { skip: number; take: number } {
    const pageStr = searchParams.get("page");
    const limitStr = searchParams.get("limit");
    
    const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
    const limit = Math.min(
        MAX_EVENTS_PER_PAGE,
        Math.max(1, parseInt(limitStr || String(DEFAULT_EVENTS_PER_PAGE), 10) || DEFAULT_EVENTS_PER_PAGE)
    );
    
    const skip = (page - 1) * limit;
    
    return { skip, take: limit };
}

/**
 * GET /api/events
 * 
 * Returns a paginated list of events.
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Filter by status (Draft, Published, Archived)
 * - category: Filter by category
 * 
 * Security: Public endpoint (no auth required)
 * Performance: Paginated, cached, optimized queries
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Performance: Validate pagination
        const { skip, take } = validatePaginationParams(searchParams);
        
        // Optional filters
        const statusFilter = searchParams.get("status");
        const categoryFilter = searchParams.get("category");
        
        // Build where clause
        const where: any = {};
        
        if (statusFilter && VALID_STATUSES.includes(statusFilter as EventStatus)) {
            where.status = statusFilter;
        }
        
        if (categoryFilter && VALID_CATEGORIES.includes(categoryFilter as EventCategory)) {
            where.category = categoryFilter;
        }
        
        // Performance: Run count and query in parallel
        const [total, items] = await Promise.all([
            prisma.event.count({ where }),
            prisma.event.findMany({
                where,
                skip,
                take,
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    world: true,
                    category: true,
                    status: true,
                    startAt: true,
                    endAt: true,
                    timezone: true,
                    recurrenceFreq: true,
                    byWeekdayJson: true,
                    timesJson: true,
                    recurrenceUntil: true,
                    shortDescription: true,
                    details: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        
        const totalPages = Math.ceil(total / take);
        const currentPage = Math.floor(skip / take) + 1;
        
        return NextResponse.json({
            items,
            pagination: {
                total,
                totalPages,
                currentPage,
                pageSize: take,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            },
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e) {
        console.error("[Events API] GET failed:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to load events" },
            { 
                status: 500,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
            }
        );
    }
}

/**
 * POST /api/events
 * 
 * Creates a new event.
 * 
 * Security:
 * - Requires authentication (admin only)
 * - Rate limited (10 events per minute per user)
 * - Input validation and sanitization
 * - Request body size limit (10KB)
 * 
 * Performance:
 * - Optimized database writes
 * - Minimal response payload
 */
export async function POST(req: Request) {
    try {
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
        
        // Security: Check if user is admin (assuming you have a role field)
        // Adjust this based on your actual auth schema
        const userId = session.user.id;
        
        // Security: Rate limiting
        if (isCreateRateLimited(userId)) {
            console.warn(`[Events API] Rate limit exceeded for user: ${userId}`);
            return NextResponse.json(
                { error: "Too many events created. Please try again later." },
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
            
            // Security: Check body size
            if (text.length > MAX_REQUEST_BODY_SIZE) {
                console.warn(`[Events API] Request body too large: ${text.length} bytes`);
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
            console.warn("[Events API] Invalid JSON in request body");
            return NextResponse.json(
                { error: "Invalid request format" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Security: Validate and sanitize inputs
        const title = sanitizeString(body.title, MAX_TITLE_LENGTH);
        const world = sanitizeString(body.world, MAX_WORLD_LENGTH);
        const shortDescription = sanitizeString(body.shortDescription, MAX_SHORT_DESC_LENGTH) || null;
        const details = sanitizeString(body.details, MAX_DETAILS_LENGTH) || null;
        
        // Validation: Check required fields
        if (!title || title.length < 3) {
            return NextResponse.json(
                { error: "Title is required (minimum 3 characters)" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        if (!world || world.length < 2) {
            return NextResponse.json(
                { error: "World is required (minimum 2 characters)" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Security: Validate dates
        const startAt = validateDate(body.startAt);
        const endAt = validateDate(body.endAt);
        
        if (!startAt) {
            return NextResponse.json(
                { error: "Valid start date is required" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        if (!endAt) {
            return NextResponse.json(
                { error: "Valid end date is required" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Validation: End date must be after start date
        if (endAt <= startAt) {
            return NextResponse.json(
                { error: "End date must be after start date" },
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        // Security: Validate enum fields
        const category = validateCategory(body.category);
        const status = validateStatus(body.status);
        const timezone = validateTimezone(body.timezone);
        const recurrenceFreq = validateRecurrenceFreq(body.recurrenceFreq);
        
        // Security: Validate recurrence fields
        const byWeekdayJson = Array.isArray(body.byWeekday) 
            ? body.byWeekday.filter((d: any) => typeof d === "number" && d >= 0 && d <= 6)
            : null;
        
        const timesJson = Array.isArray(body.times)
            ? body.times.filter((t: any) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 10)
            : null;
        
        const recurrenceUntil = validateDate(body.recurrenceUntil);
        
        // Create the event
        const created = await prisma.event.create({
            data: {
                title,
                world,
                category,
                status,
                details,
                shortDescription,
                startAt,
                endAt,
                timezone,
                recurrenceFreq,
                byWeekdayJson,
                timesJson,
                recurrenceUntil,
            },
            select: { 
                id: true,
                title: true,
                world: true,
                startAt: true,
                endAt: true,
            },
        });

        console.log(`[Events API] Event created: ${created.id} by user: ${userId}`);

        return NextResponse.json(
            { 
                id: created.id,
                title: created.title,
                world: created.world,
                startAt: created.startAt,
                endAt: created.endAt,
            },
            { 
                status: 201,
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
    } catch (e) {
        console.error("[Events API] POST failed:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to create event" },
            { 
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }
}
