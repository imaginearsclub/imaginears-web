import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { logEventUpdated } from "@/lib/audit-logger";
import { createApiHandler } from "@/lib/api-middleware";
import { validateEventUpdate } from "../utils";

export const runtime = "nodejs";

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
