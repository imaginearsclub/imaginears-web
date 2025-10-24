import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Security: Constants
const MAX_ITEMS_PER_TYPE = 15; // Fetch up to 15 of each type
const MAX_TOTAL_ITEMS = 20; // Return top 20 merged items
const CACHE_SECONDS = 30; // Cache for 30 seconds (admins see near real-time)

// Security: Rate limiting for activity feed
const activityRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_ACTIVITY_REQUESTS = 30; // Max 30 requests per minute per user

type ActivityItem = {
    id: string;
    kind: "event" | "application";
    title: string;
    sub: string;       // small subtitle (status/category/email etc.)
    when: string;      // ISO string
};

/**
 * Security: Check rate limiting
 */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = activityRequests.get(identifier);
    
    if (!record || now > record.resetTime) {
        activityRequests.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
        return false;
    }
    
    record.count++;
    return record.count > MAX_ACTIVITY_REQUESTS;
}

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
        // Security: Require admin authentication
        const session = await requireAdmin();
        
        // requireAdmin() returns null if unauthorized (doesn't throw)
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { 
                    status: 401,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                }
            );
        }
        
        const userId = session.user.id;
        
        const h = await nextHeaders();
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        userId;
        
        // Security: Rate limiting
        if (isRateLimited(clientIP)) {
            console.warn(`[Admin Activity] Rate limit exceeded for user: ${userId}`);
            return NextResponse.json(
                { error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": "60",
                        "Content-Type": "application/json; charset=utf-8",
                    },
                }
            );
        }

        // Performance: Parallel queries with limited results
        const [events, apps] = await Promise.all([
            prisma.event.findMany({
                select: { 
                    id: true, 
                    title: true, 
                    updatedAt: true, 
                    status: true, 
                    category: true 
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
                    role: true 
                },
                orderBy: { updatedAt: "desc" },
                take: MAX_ITEMS_PER_TYPE,
            }),
        ]);

        // Map events to activity items
        const eItems: ActivityItem[] = events.map((e) => ({
            id: e.id,
            kind: "event" as const,
            title: e.title || "Untitled Event",
            sub: `${e.status} • ${e.category}`,
            when: e.updatedAt.toISOString(),
        }));

        // Map applications to activity items (with masked emails)
        const aItems: ActivityItem[] = apps.map((a) => ({
            id: a.id,
            kind: "application" as const,
            title: a.name || "Application",
            // Security: Mask email address for privacy
            sub: `${a.status} • ${a.role} • ${maskEmail(a.email)}`,
            when: a.updatedAt.toISOString(),
        }));

        // Merge, sort by date (most recent first), and limit
        const merged = [...eItems, ...aItems]
            .sort((a, b) => {
                // Sort descending by date (newest first)
                const dateA = new Date(a.when).getTime();
                const dateB = new Date(b.when).getTime();
                return dateB - dateA;
            })
            .slice(0, MAX_TOTAL_ITEMS);

        return NextResponse.json(
            merged,
            {
                headers: {
                    // Performance: Cache for 30 seconds (near real-time for admins)
                    "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
                    "Content-Type": "application/json; charset=utf-8",
                    "X-Content-Type-Options": "nosniff",
                },
            }
        );
    } catch (e: any) {
        console.error("[Admin Activity] Error:", e instanceof Error ? e.message : "Unknown error");
        
        // Security: Don't expose internal error details
        return NextResponse.json(
            { error: "Failed to load activity feed" },
            { 
                status: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
            }
        );
    }
}
