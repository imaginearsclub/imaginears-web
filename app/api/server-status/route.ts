import { NextResponse } from "next/server";
import { getMinecraftServerStatus, getUptimePercentage } from "@/lib/minecraft-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // Always fetch fresh data

// Security: Rate limiting per IP would be ideal, but for now we'll cache aggressively
export const revalidate = 60; // Cache for 1 minute

const SERVER_ADDRESS = process.env['MINECRAFT_SERVER_ADDRESS'] || "iears.us";

/**
 * Public API endpoint for server status
 * GET /api/server-status
 */
export async function GET() {
    try {
        const status = await getMinecraftServerStatus(SERVER_ADDRESS);
        const uptime = getUptimePercentage(SERVER_ADDRESS);

        return NextResponse.json({
            success: true,
            data: {
                online: status.online,
                players: {
                    online: status.playersOnline || 0,
                    max: status.playersMax || 100,
                },
                version: status.version,
                latency: status.latency,
                uptime: uptime,
                serverAddress: SERVER_ADDRESS,
            },
        });
    } catch (error) {
        console.error("[API] Server status error:", error);
        
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch server status",
                data: {
                    online: false,
                    players: { online: 0, max: 100 },
                    serverAddress: SERVER_ADDRESS,
                },
            },
            { status: 200 } // Return 200 even on error to not break the UI
        );
    }
}

