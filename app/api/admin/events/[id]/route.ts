import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { sanitizeInput, sanitizeDescription } from "@/lib/input-sanitization";
import { logEventUpdated } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";

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

/**
 * GET /api/admin/events/[id]
 * Get event details
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const GET = createApiHandler(
    {
        auth: "admin",
        rateLimit: {
            key: "admin:events:detail",
            limit: 60,
            window: 60,
            strategy: "sliding-window",
        },
    },
    async (_req, { userId, params }) => {
        const id = params!['id']!;
        
        // Security: Validate ID format
        if (!id || typeof id !== 'string' || id.length > 50) {
            log.warn("Invalid event ID format", { id, userId });
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }
        
        const event = await prisma.event.findUnique({
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
        
        if (!event) {
            log.warn("Event not found", { id, userId });
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        
        log.info("Event detail retrieved", { eventId: id, userId });
        
        return NextResponse.json(event);
    }
);

/**
 * PATCH /api/admin/events/[id]
 * Update an event
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const PATCH = createApiHandler(
    {
        auth: "admin",
        rateLimit: {
            key: "admin:events:update",
            limit: 30,
            window: 60,
            strategy: "sliding-window",
        },
        maxBodySize: 100_000, // 100KB max
    },
    async (req, { userId, params }) => {
        const id = params!['id']!;
        
        // Security: Validate ID format
        if (!id || typeof id !== 'string' || id.length > 50) {
            log.warn("Invalid event ID format for update", { id, userId });
            return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
        }
        
        const body = await req.json();

        const validation = validateEventUpdate(body);
        if (validation.error) {
            log.warn("Event update validation failed", { 
                error: validation.error, 
                userId 
            });
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        // Check if event exists
        const existing = await prisma.event.findUnique({
            where: { id },
            select: { id: true, title: true },
        });
        
        if (!existing) {
            log.warn("Event not found for update", { id, userId });
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const updated = await prisma.event.update({
            where: { id },
            data: validation.data,
        });

        // Audit log (note: userId is always string here due to middleware auth)
        logEventUpdated(
            id, 
            userId!,
            '', // Email not available in middleware context
            Object.keys(validation.data)
        );
        
        log.info("Event updated successfully", { 
            eventId: id, 
            userId,
            fields: Object.keys(validation.data)
        });

        return NextResponse.json(updated);
    }
);
