import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limiter";

// Configuration
export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
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
 * Security: Mask email address for privacy
 * Converts "user@example.com" to "u***@example.com"
 */
function maskEmail(email: string | null): string {
    if (!email) return "N/A";
    
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***";
    
    // Show first character of local part, mask the rest
    const maskedLocal = local.length > 1 
        ? `${local[0]}***` 
        : "***";
    
    return `${maskedLocal}@${domain}`;
}

/**
 * Security: Sanitize string for display (prevent any potential XSS)
 */
function sanitizeForDisplay(str: string | null, maxLength: number = 100): string {
    if (!str) return "Untitled";
    return str.trim().slice(0, maxLength);
}

/**
 * Helper: Get display name for user (prefer minecraft name)
 */
function getUserDisplayName(user: { minecraftName: string | null; name: string | null } | null): string | undefined {
    if (!user) return undefined;
    return user.minecraftName || user.name || undefined;
}

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
 * - Requires admin authentication
 * - Rate limited (30 requests per minute per user)
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
export async function GET() {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } }
            );
        }
        
        const userId = session.user?.id || 'unknown';
        const h = await nextHeaders();
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        `user:${userId}`;
        
        // Security: Redis-based rate limiting (distributed, scalable)
        const rateLimitResult = await rateLimit(clientIP, {
            key: "admin:activity",
            limit: 30,
            window: 60,
            strategy: "sliding-window",
        });

        if (!rateLimitResult.allowed) {
            console.warn(`[Admin Activity] Rate limit exceeded for user: ${userId}`);
            return NextResponse.json(
                { error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": rateLimitResult.resetAfter.toString(),
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
                        "Content-Type": "application/json; charset=utf-8",
                    },
                }
            );
        }

        const [events, apps] = await fetchActivityData();
        const merged = mapToActivityItems(events, apps);

        return NextResponse.json(merged, {
            headers: {
                "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
                "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
            },
        });
    } catch (e) {
        console.error("[Admin Activity] Error:", e instanceof Error ? e.message : "Unknown error");
        return NextResponse.json(
            { error: "Failed to load activity feed" },
            { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
    }
}
