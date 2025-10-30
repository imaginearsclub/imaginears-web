import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { createApiHandler } from "@/lib/api-middleware";
import { z } from "zod";
import { buildEventWhereClause } from "./utils";

export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
export const dynamic = "force-dynamic";

// Validation schema for query parameters
const eventsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    take: z.coerce.number().int().min(1).max(500).default(200),
    status: z.enum(["Draft", "Published", "Archived"]).optional(),
    category: z.enum(["Fireworks", "SeasonalOverlay", "Seasonal", "MeetAndGreet", "Parade", "Other"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

type EventsQuery = z.infer<typeof eventsQuerySchema>;

/**
 * GET /api/admin/events
 * List events with filtering and pagination
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const GET = createApiHandler(
    {
        auth: "admin",
        rateLimit: {
            key: "admin:events:list",
            limit: 60,
            window: 60,
            strategy: "sliding-window",
        },
        validateQuery: eventsQuerySchema,
    },
    async (_req, { userId, validatedQuery }) => {
        const query = validatedQuery as EventsQuery;
        const { page, take } = query;
        const skip = (page - 1) * take;
        
        // Build safe where clause with validated filters
        const where = buildEventWhereClause(query);

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
                    visibility: true,
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

        log.info("Admin events listed", { 
            userId, 
            count: items.length, 
            page, 
            total,
            filters: { status: query.status, category: query.category, visibility: query.visibility }
        });

        return NextResponse.json({ 
            items,
            pagination: {
                total,
                page,
                pageSize: take,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
);
