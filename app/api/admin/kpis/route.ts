import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { getMinecraftServerStatus, getUptimePercentage, getPlayerCountHistory } from "@/lib/minecraft-status";

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
 * GET /api/admin/kpis
 * 
 * Returns key performance indicators for admin dashboard:
 * - Total players (users)
 * - Total events
 * - Active applications (New + InReview status)
 * - Minecraft server status
 * - Trend data (7-day comparison)
 * 
 * Security: Requires admin authentication
 * Performance: Cached for 15 seconds, parallel queries
 */
export async function GET() {
    try {
        const session = await requireAdmin();
        
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Calculate date ranges for trends (last 7 days vs previous 7 days)
        const now = new Date();
        const last7DaysStart = new Date(now);
        last7DaysStart.setDate(now.getDate() - 7);
        
        const previous7DaysStart = new Date(now);
        previous7DaysStart.setDate(now.getDate() - 14);
        
        const previous7DaysEnd = new Date(now);
        previous7DaysEnd.setDate(now.getDate() - 7);

        // Parallel queries for better performance
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
        ] = await Promise.all([
            // Current totals
            prisma.user.count(),
            prisma.event.count(),
            prisma.application.count({
                where: {
                    status: {
                        in: ["New", "InReview"]
                    }
                }
            }),
            // Trend data - last 7 days
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: last7DaysStart
                    }
                }
            }),
            // Trend data - previous 7 days
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: previous7DaysStart,
                        lt: previous7DaysEnd
                    }
                }
            }),
            prisma.event.count({
                where: {
                    createdAt: {
                        gte: last7DaysStart
                    }
                }
            }),
            prisma.event.count({
                where: {
                    createdAt: {
                        gte: previous7DaysStart,
                        lt: previous7DaysEnd
                    }
                }
            }),
            prisma.application.count({
                where: {
                    status: {
                        in: ["New", "InReview"]
                    },
                    createdAt: {
                        gte: last7DaysStart
                    }
                }
            }),
            prisma.application.count({
                where: {
                    status: {
                        in: ["New", "InReview"]
                    },
                    createdAt: {
                        gte: previous7DaysStart,
                        lt: previous7DaysEnd
                    }
                }
            }),
            // Server status
            (async () => {
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
                    return {
                        address: serverAddress,
                        online: false,
                        players: { online: 0, max: 0 },
                        uptimePercentage: null,
                        playerHistory: [],
                        error: "Unable to connect"
                    };
                }
            })()
        ]);

        // Calculate trends
        const playersTrend = calculateTrend(playersLast7Days, playersPrevious7Days);
        const eventsTrend = calculateTrend(eventsLast7Days, eventsPrevious7Days);
        const appsTrend = calculateTrend(appsLast7Days, appsPrevious7Days);

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

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
                "Content-Type": "application/json; charset=utf-8",
                "X-Content-Type-Options": "nosniff",
            }
        });
    } catch (e: any) {
        console.error("[Admin KPIs] Error:", e instanceof Error ? e.message : "Unknown error");
        
        return NextResponse.json(
            { error: "Failed to load KPIs" },
            { status: 500 }
        );
    }
}
