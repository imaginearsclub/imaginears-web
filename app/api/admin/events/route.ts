import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { log } from "@/lib/logger";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limiter";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
export const dynamic = "force-dynamic";

// Security: Constants for pagination and validation
const MAX_TAKE = 500;
const DEFAULT_TAKE = 200;
const MIN_TAKE = 1;

/**
 * Security: Validate pagination parameters
 */
function validatePaginationParams(searchParams: URLSearchParams): { skip: number; take: number; page: number } {
    const pageStr = searchParams.get("page");
    const takeStr = searchParams.get("take");
    
    // Validate and clamp take parameter
    let take = DEFAULT_TAKE;
    if (takeStr && /^\d+$/.test(takeStr)) {
        take = Math.min(Math.max(Number(takeStr), MIN_TAKE), MAX_TAKE);
    }
    
    // Validate and calculate skip for pagination
    let page = 1;
    if (pageStr && /^\d+$/.test(pageStr)) {
        page = Math.max(Number(pageStr), 1);
    }
    
    const skip = (page - 1) * take;
    
    return { skip, take, page };
}

/**
 * Security: Validate filter parameters
 */
function buildWhereClause(searchParams: URLSearchParams): Prisma.EventWhereInput {
    const where: Prisma.EventWhereInput = {};
    
    // Status filter
    const status = searchParams.get("status");
    if (status && ["Draft", "Published", "Archived"].includes(status)) {
        where.status = status as "Draft" | "Published" | "Archived";
    }
    
    // Category filter
    const category = searchParams.get("category");
    if (category && ["Fireworks", "SeasonalOverlay", "Seasonal", "MeetAndGreet", "Parade", "Other"].includes(category)) {
        where.category = category as any;
    }
    
    // Visibility filter
    const visibility = searchParams.get("visibility");
    if (visibility && ["PUBLIC", "PRIVATE"].includes(visibility)) {
        where.visibility = visibility as "PUBLIC" | "PRIVATE";
    }
    
    return where;
}

export async function GET(req: Request) {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            log.warn("Unauthorized admin events list access attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Security: Rate limiting for admin endpoints
        const rateLimitResult = await rateLimit(`admin:${session.user.id}`, RATE_LIMITS.ADMIN);
        
        if (!rateLimitResult.allowed) {
            log.warn("Admin events list rate limit exceeded", { 
                userId: session.user.id, 
                remaining: rateLimitResult.remaining 
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

        const { searchParams } = new URL(req.url);
        
        // Performance: Validate pagination parameters
        const { skip, take, page } = validatePaginationParams(searchParams);
        
        // Security: Build safe where clause with validated filters
        const where = buildWhereClause(searchParams);

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
        }, {
            headers: {
                "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            }
        });
    } catch (e) {
        log.error("GET /api/admin/events failed", { error: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined });
        return NextResponse.json({ error: "Failed to load events", items: [] }, { status: 500 });
    }
}
