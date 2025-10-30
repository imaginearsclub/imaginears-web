/**
 * Shared utilities for KPI calculations
 */

import { prisma } from "@/lib/prisma";
import { getMinecraftServerStatus, getUptimePercentage, getPlayerCountHistory } from "@/lib/minecraft-status";
import { log } from "@/lib/logger";

// Performance: Timeout for slow database queries
export const DB_QUERY_TIMEOUT_MS = 10000; // 10 seconds max for all queries

/**
 * Calculate percentage change between two values
 * Returns "+X%" or "-X%" or "0%" or "—" if previous is 0
 */
export function calculateTrend(current: number, previous: number): string {
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
export function getTrendDateRanges() {
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
 * Fetch Minecraft server status with error handling
 */
export async function fetchServerStatus() {
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
 * Fetch all KPI data in parallel with timeout protection
 * 
 * Performance: Uses Promise.race to ensure queries don't hang indefinitely
 * Memory: All queries complete or timeout, preventing resource leaks
 */
export async function fetchKPIData(
    last7DaysStart: Date, 
    previous7DaysStart: Date, 
    previous7DaysEnd: Date
) {
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

