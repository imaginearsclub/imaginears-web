import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { log } from "@/lib/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import { sanitizeInput, sanitizeDescription } from "@/lib/input-sanitization";
import { logEventUpdated } from "@/lib/audit-logger";

export const runtime = "nodejs";

// Security: Constants
const MAX_TITLE_LENGTH = 200;
const MAX_WORLD_LENGTH = 100;
const MAX_SHORT_DESC_LENGTH = 500;
const MAX_DETAILS_LENGTH = 50000;

// Valid enum values from Prisma schema
const VALID_CATEGORIES = ["Fireworks", "SeasonalOverlay", "Seasonal", "MeetAndGreet", "Parade", "Other"];
const VALID_STATUSES = ["Draft", "Published", "Archived"];

function validateEnum(value: unknown, validValues: string[]): boolean {
    return typeof value === 'string' && validValues.includes(value);
}

function validateStringLength(value: unknown, min: number, max: number): string | null {
    if (!value || typeof value !== 'string') return null;
    const str = sanitizeInput(String(value), max);
    if (str.length < min || str.length > max) {
        return null;
    }
    return str;
}

// eslint-disable-next-line complexity
function validateEventUpdate(body: Record<string, unknown>): { data: Record<string, unknown>; error?: string } {
    const data: Record<string, unknown> = {};
    
    if (body['title'] !== undefined) {
        const title = validateStringLength(body['title'], 1, MAX_TITLE_LENGTH);
        if (!title) return { data, error: "Title must be 1-200 characters" };
        data["title"] = title;
    }
    
    if (body['shortDescription'] !== undefined) {
        const shortDesc = typeof body['shortDescription'] === 'string' 
            ? sanitizeDescription(body['shortDescription'], MAX_SHORT_DESC_LENGTH)
            : null;
        data['shortDescription'] = shortDesc;
    }
    
    if (body['details'] !== undefined) {
        const details = typeof body['details'] === 'string'
            ? sanitizeDescription(body['details'], MAX_DETAILS_LENGTH)
            : null;
        data['details'] = details;
    }
    
    if (body['category'] !== undefined) {
        if (!validateEnum(body['category'], VALID_CATEGORIES)) {
            return { data, error: "Invalid category" };
        }
        data["category"] = body['category'];
    }
    
    if (body['status'] !== undefined) {
        if (!validateEnum(body['status'], VALID_STATUSES)) {
            return { data, error: "Invalid status" };
        }
        data["status"] = body['status'];
    }
    
    if (body['world'] !== undefined) {
        const world = validateStringLength(body['world'], 1, MAX_WORLD_LENGTH);
        if (!world) return { data, error: "World must be 1-100 characters" };
        data["world"] = world;
    }
    
    if (body['startAt'] !== undefined) {
        try {
            const date = new Date(body['startAt'] as string);
            if (isNaN(date.getTime())) {
                return { data, error: "Invalid startAt date" };
            }
            data["startAt"] = date;
        } catch {
            return { data, error: "Invalid startAt date" };
        }
    }
    
    if (body['endAt'] !== undefined) {
        if (body['endAt'] === null) {
            data["endAt"] = null;
        } else {
            try {
                const date = new Date(body['endAt'] as string);
                if (isNaN(date.getTime())) {
                    return { data, error: "Invalid endAt date" };
                }
                data["endAt"] = date;
            } catch {
                return { data, error: "Invalid endAt date" };
            }
        }
    }
    
    // Validation: If both dates provided, end must be after start
    if (data["startAt"] && data["endAt"] && data["endAt"] <= data["startAt"]) {
        return { data, error: "End date must be after start date" };
    }
    
    return { data };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            log.warn("Unauthorized admin event detail access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Security: Rate limiting for admin endpoints
        const rateLimitResult = await rateLimit(`admin:${session.user.id}`, RATE_LIMITS.ADMIN);
        
        if (!rateLimitResult.allowed) {
            log.warn("Admin event detail rate limit exceeded", { 
                userId: session.user.id 
            });
            return NextResponse.json(
                { error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                        "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
                        "Retry-After": rateLimitResult.resetAfter.toString(),
                    }
                }
            );
        }
        
        // Next.js 15+: params is now a Promise
        const { id } = await params;
        
        // Security: Validate ID format
        if (!id || typeof id !== 'string' || id.length > 50) {
            log.warn("Invalid event ID format", { id });
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }
        
        const e = await prisma.event.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                shortDescription: true,
                details: true,
                category: true,
                status: true,
                world: true,
                startAt: true,
                endAt: true,
                timezone: true,
                recurrenceFreq: true,
                byWeekdayJson: true,
                timesJson: true,
                recurrenceUntil: true,
                visibility: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        
        if (!e) {
            log.warn("Event not found", { id });
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        
        return NextResponse.json(e, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            }
        });
    } catch (error) {
        log.error("/api/admin/events/[id] GET failed", { 
            error: error instanceof Error ? error.message : String(error), 
            stack: error instanceof Error ? error.stack : undefined 
        });
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAdmin();
        if (!session) {
            log.warn("Unauthorized admin event update attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        // Security: Rate limiting for admin endpoints
        const rateLimitResult = await rateLimit(`admin:${session.user.id}`, RATE_LIMITS.ADMIN);
        
        if (!rateLimitResult.allowed) {
            log.warn("Admin event update rate limit exceeded", { 
                userId: session.user.id 
            });
            return NextResponse.json(
                { error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                        "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
                        "Retry-After": rateLimitResult.resetAfter.toString(),
                    }
                }
            );
        }
        
        const { id } = await params;
        
        // Security: Validate ID format
        if (!id || typeof id !== 'string' || id.length > 50) {
            log.warn("Invalid event ID format for update", { id });
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }
        
        // Security: Validate request body size
        const text = await req.text();
        if (text.length > 100_000) { // 100KB max
            log.warn("Event update request body too large", { 
                size: text.length, 
                userId: session.user.id 
            });
            return NextResponse.json({ error: "Request body too large" }, { status: 413 });
        }
        
        let body: Record<string, unknown>;
        try {
            body = JSON.parse(text);
        } catch {
            log.warn("Invalid JSON in event update request", { userId: session.user.id });
            return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
        }

        const validation = validateEventUpdate(body);
        if (validation.error) {
            log.warn("Event update validation failed", { 
                error: validation.error, 
                userId: session.user.id 
            });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Check if event exists
        const existing = await prisma.event.findUnique({
            where: { id },
            select: { id: true, title: true },
        });
        
        if (!existing) {
            log.warn("Event not found for update", { id, userId: session.user.id });
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: validation.data,
        });

        // Audit log
        logEventUpdated(
            id, 
            session.user.id,
            session.user.email || '',
            Object.keys(validation.data)
        );
        
        log.info("Event updated successfully", { 
            eventId: id, 
            userId: session.user.id,
            fields: Object.keys(validation.data)
        });

        return NextResponse.json(updated, {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            }
        });
    } catch (error) {
        log.error("/api/admin/events/[id] PATCH failed", { 
            error: error instanceof Error ? error.message : String(error), 
            stack: error instanceof Error ? error.stack : undefined 
        });
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
