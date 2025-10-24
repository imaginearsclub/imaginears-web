import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import type { Player } from "@/components/admin/PlayerTable";

export const runtime = "nodejs";

// Force dynamic rendering for authenticated endpoints
// This ensures fresh session validation on every request
export const dynamic = "force-dynamic";

// Mock data - replace with actual Minecraft server API integration
const MOCK_PLAYERS: Player[] = [
    {
        name: "Steve",
        rank: "Member",
        server: "Adventure World",
        online: true,
        joinedAt: "2024-01-15",
    },
    {
        name: "Alex",
        rank: "Creator",
        server: "Creative Hub",
        online: true,
        joinedAt: "2024-02-10",
    },
    {
        name: "Herobrine",
        rank: "Staff",
        server: "Admin Lounge",
        online: false,
        joinedAt: "2023-12-01",
    },
    {
        name: "Notch",
        rank: "Staff",
        server: "Development Lab",
        online: true,
        joinedAt: "2023-11-20",
    },
    {
        name: "Enderman",
        rank: "Member",
        server: "The End",
        online: false,
        joinedAt: "2024-03-05",
    },
    {
        name: "Creeper",
        rank: "Member",
        server: "Survival World",
        online: true,
        joinedAt: "2024-01-20",
    },
];

/**
 * GET /api/admin/players
 * Fetch all players from Minecraft server
 * 
 * Security: Requires admin authentication
 * Performance: Cached for 30 seconds
 */
export async function GET(_req: Request) {
    try {
        // Security: Require admin authentication
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // TODO: Replace with actual Minecraft server API integration
        // For now, return mock data
        // 
        // Example integration:
        // 1. Use Minecraft RCON to query online players
        // 2. Use a plugin like LuckPerms API to get ranks
        // 3. Query your database for player join dates
        // 
        // Example:
        // const rconResponse = await rconQuery(MINECRAFT_SERVER, "list");
        // const players = parsePlayerList(rconResponse);
        // const enrichedPlayers = await enrichPlayerData(players);

        // Simulate network delay (remove in production)
        await new Promise(resolve => setTimeout(resolve, 300));

        return NextResponse.json({
            players: MOCK_PLAYERS,
            timestamp: new Date().toISOString(),
            server: {
                address: process.env['MINECRAFT_SERVER'] || "mc.example.com",
                online: true,
            },
        });
    } catch (error: any) {
        console.error("[Players API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch players" },
            { status: 500 }
        );
    }
}

