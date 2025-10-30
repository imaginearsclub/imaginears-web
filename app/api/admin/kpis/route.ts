import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import {
    calculateTrend,
    getTrendDateRanges,
    fetchKPIData
} from "./utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 15 seconds (frequent updates for dashboard)
const CACHE_SECONDS = 15;

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
