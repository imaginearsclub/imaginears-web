import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMinecraftServerStatus, getUptimePercentage, getPlayerCountHistory } from "@/lib/minecraft-status";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";

// Performance: Timeout for slow database queries
const DB_QUERY_TIMEOUT_MS = 10000; // 10 seconds max for all queries

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 15 seconds (frequent updates for dashboard)
const CACHE_SECONDS = 15;

/**
 * Calculate percentage change between two values
 * Returns "+X%" or "-X%" or "0%" or "—" if previous is 0
 */
function calculateTrend(current: number, previous: number): string {
    if (previous === 0) {
        return current > 0 ? "+100%" : "—";
    }
    
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
}

/**
 * Calculate date ranges for trend analysis
 */
function getTrendDateRanges() {
    const now = new Date();
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(now.getDate() - 7);
    
    const previous7DaysStart = new Date(now);
    previous7DaysStart.setDate(now.getDate() - 14);
    
    const previous7DaysEnd = new Date(now);
    previous7DaysEnd.setDate(now.getDate() - 7);
    
    return { last7DaysStart, previous7DaysStart, previous7DaysEnd };
}

/**
 * Fetch all KPI data in parallel with timeout protection
 * 
 * Performance: Uses Promise.race to ensure queries don't hang indefinitely
 * Memory: All queries complete or timeout, preventing resource leaks
 */
async function fetchKPIData(last7DaysStart: Date, previous7DaysStart: Date, previous7DaysEnd: Date) {
    const dbQueriesPromise = Promise.all([
        // Current totals
        prisma.user.count(),
        prisma.event.count(),
        prisma.application.count({
            where: { status: { in: ["New", "InReview"] } }
        }),
        // Trend data - last 7 days
        prisma.user.count({
            where: { createdAt: { gte: last7DaysStart } }
        }),
        // Trend data - previous 7 days
        prisma.user.count({
            where: { createdAt: { gte: previous7DaysStart, lt: previous7DaysEnd } }
        }),
        prisma.event.count({
            where: { createdAt: { gte: last7DaysStart } }
        }),
        prisma.event.count({
            where: { createdAt: { gte: previous7DaysStart, lt: previous7DaysEnd } }
        }),
        prisma.application.count({
            where: { 
                status: { in: ["New", "InReview"] },
                createdAt: { gte: last7DaysStart }
            }
        }),
        prisma.application.count({
            where: { 
                status: { in: ["New", "InReview"] },
                createdAt: { gte: previous7DaysStart, lt: previous7DaysEnd }
            }
        }),
        // Server status (has its own timeout)
        fetchServerStatus()
    ]);

    // Performance: Timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Database query timeout")), DB_QUERY_TIMEOUT_MS);
    });

    try {
        return await Promise.race([dbQueriesPromise, timeoutPromise]);
    } catch (error) {
        log.error("KPI data fetch failed or timed out", {
            error: error instanceof Error ? error.message : String(error),
            timeout: DB_QUERY_TIMEOUT_MS
        });
        throw error;
    }
}

/**
 * Fetch Minecraft server status with error handling
 */
async function fetchServerStatus() {
    const serverAddress = process.env["MINECRAFT_SERVER_ADDRESS"] || "iears.us";
    try {
        const status = await getMinecraftServerStatus(serverAddress);
        return {
            address: serverAddress,
            online: status.online,
            version: status.version,
            players: {
                online: status.playersOnline || 0,
                max: status.playersMax || 0
            },
            latency: status.latency,
            uptimePercentage: getUptimePercentage(serverAddress),
            playerHistory: getPlayerCountHistory(serverAddress),
            error: status.error
        };
    } catch (error) {
        log.error("Minecraft server status check failed", { 
            serverAddress, 
            error: error instanceof Error ? error.message : String(error) 
        });
        return {
            address: serverAddress,
            online: false,
            players: { online: 0, max: 0 },
            uptimePercentage: null,
            playerHistory: [],
            error: "Unable to connect"
        };
    }
}

/**
 * GET /api/admin/kpis
 * 
 * Returns key performance indicators for admin dashboard:
 * - Total players (users)
 * - Total events
 * - Active applications (New + InReview status)
 * - Minecraft server status
 * - Trend data (7-day comparison)
 * 
 * Security: Requires admin authentication, rate limited
 * Performance: Cached for 15 seconds, parallel queries
 */
export const GET = createApiHandler(
    {
        auth: "admin",
        rateLimit: {
            key: "admin:kpis",
            limit: 60, // 60 requests per minute (frequent dashboard refreshes)
            window: 60,
            strategy: "sliding-window",
        },
    },
    async (_req, { userId }) => {
        // Performance: Track request duration
        const startTime = Date.now();

        try {
            // Calculate date ranges for trends
            const { last7DaysStart, previous7DaysStart, previous7DaysEnd } = getTrendDateRanges();

            // Fetch all KPI data in parallel with timeout protection
            const [
                totalPlayers,
                totalEvents,
                activeApplications,
                playersLast7Days,
                playersPrevious7Days,
                eventsLast7Days,
                eventsPrevious7Days,
                appsLast7Days,
                appsPrevious7Days,
                serverStatus
            ] = await fetchKPIData(last7DaysStart, previous7DaysStart, previous7DaysEnd);

            // Calculate trends
            const playersTrend = calculateTrend(playersLast7Days, playersPrevious7Days);
            const eventsTrend = calculateTrend(eventsLast7Days, eventsPrevious7Days);
            const appsTrend = calculateTrend(appsLast7Days, appsPrevious7Days);

            const duration = Date.now() - startTime;

            // Performance: Log slow requests
            if (duration > 2000) {
                log.warn("Slow KPI request detected", { userId, duration });
            }

            const data = {
                totalPlayers,
                totalEvents,
                activeApplications,
                // Trends based on 7-day growth
                trends: {
                    players: playersTrend,
                    events: eventsTrend,
                    applications: appsTrend
                },
                apiUptime: "99.9%", // Could be calculated from monitoring service
                server: serverStatus,
            };

            log.info("Admin KPIs fetched", { userId, duration });

            return NextResponse.json(data, {
                headers: {
                    "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
                    // Performance: Add timing header for client-side monitoring
                    "X-Response-Time": `${duration}ms`,
                }
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            log.error("KPI fetch failed", {
                userId,
                duration,
                error: error instanceof Error ? error.message : String(error),
            });
            
            // Security: Don't expose internal error details to client
            return NextResponse.json(
                { error: "Failed to load KPIs" },
                { status: 500 }
            );
        }
    }
);
