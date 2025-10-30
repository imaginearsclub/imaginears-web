import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { sanitizeForDisplay, maskEmail } from "@/lib/input-sanitization";
import { getUserDisplayName } from "@/lib/utils";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const MAX_ITEMS_PER_TYPE = 15; // Fetch up to 15 of each type
const MAX_TOTAL_ITEMS = 20; // Return top 20 merged items
const CACHE_SECONDS = 30; // Cache for 30 seconds (admins see near real-time)

type ActivityItem = {
    id: string;
    kind: "event" | "application";
    title: string;
    sub: string;       // small subtitle (status/category/email etc.)
    when: string;      // ISO string
    updatedBy?: string | undefined; // User who made the change (minecraft name or full name)
};

/**
 * Performance: Fetch activity data in parallel
 */
async function fetchActivityData() {
    return Promise.all([
        prisma.event.findMany({
            select: { 
                id: true, 
                title: true, 
                updatedAt: true, 
                status: true, 
                category: true,
                updatedBy: {
                    select: {
                        minecraftName: true,
                        name: true,
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: MAX_ITEMS_PER_TYPE,
        }),
        prisma.application.findMany({
            select: { 
                id: true, 
                name: true, 
                email: true, 
                status: true, 
                updatedAt: true, 
                role: true,
                updatedBy: {
                    select: {
                        minecraftName: true,
                        name: true,
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: MAX_ITEMS_PER_TYPE,
        }),
    ]);
}

type EventRecord = {
    id: string;
    title: string;
    updatedAt: Date;
    status: string;
    category: string;
    updatedBy: { minecraftName: string | null; name: string | null } | null;
};

type AppRecord = {
    id: string;
    name: string;
    email: string | null;
    status: string;
    updatedAt: Date;
    role: string;
    updatedBy: { minecraftName: string | null; name: string | null } | null;
};

/**
 * Map database records to activity items
 */
function mapToActivityItems(events: EventRecord[], apps: AppRecord[]): ActivityItem[] {
    const eItems: ActivityItem[] = events.map((e) => ({
        id: e.id,
        kind: "event" as const,
        title: sanitizeForDisplay(e.title, 80),
        sub: `${e.status} • ${e.category}`,
        when: e.updatedAt.toISOString(),
        updatedBy: getUserDisplayName(e.updatedBy),
    }));

    const aItems: ActivityItem[] = apps.map((a) => ({
        id: a.id,
        kind: "application" as const,
        title: sanitizeForDisplay(a.name, 80),
        sub: `${a.status} • ${a.role} • ${maskEmail(a.email)}`,
        when: a.updatedAt.toISOString(),
        updatedBy: getUserDisplayName(a.updatedBy),
    }));

    return [...eItems, ...aItems]
        .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
        .slice(0, MAX_TOTAL_ITEMS);
}

/**
 * GET /api/admin/activity
 * 
 * Returns recent activity feed for admin dashboard.
 * Shows latest updates to events and applications.
 * 
 * Security:
 * - Requires admin authentication (handled by middleware)
 * - Rate limited via RATE_LIMITS.ADMIN (handled by middleware)
 * - Email addresses masked for privacy
 * - Cached for 30 seconds
 * 
 * Performance:
 * - Parallel queries for events and applications
 * - Limited result sets
 * - Short cache for near real-time updates
 * 
 * Returns: Array of ActivityItem (max 20 items)
 */
export const GET = createApiHandler(
    {
        auth: "admin",
        rateLimit: {
            key: "admin:activity",
            limit: 30, // 30 requests per minute (appropriate for activity feed)
            window: 60,
            strategy: "sliding-window",
        },
    },
    async (_req, { userId }) => {
        // Fetch data in parallel
        const [events, apps] = await fetchActivityData();
        
        // Map and merge activity items
        const merged = mapToActivityItems(events, apps);

        log.info("Admin activity feed fetched", { 
            userId, 
            itemCount: merged.length 
        });

        return NextResponse.json(merged, {
            headers: {
                "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
            },
        });
    }
);
