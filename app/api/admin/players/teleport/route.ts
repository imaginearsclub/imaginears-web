import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";

export const runtime = "nodejs";

// Input validation
function validatePlayerName(name: unknown): string | null {
    if (typeof name !== "string") return null;
    
    // Minecraft username rules: 3-16 characters, alphanumeric and underscore only
    const sanitized = name.trim();
    if (sanitized.length < 3 || sanitized.length > 16) return null;
    if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) return null;
    
    return sanitized;
}

/**
 * POST /api/admin/players/teleport
 * Teleport to a player on the Minecraft server
 * 
 * Security: Requires admin authentication, input validation, audit logging
 */
export async function POST(req: Request) {
    try {
        // Security: Require admin authentication
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json().catch(() => ({}));
        
        // Input validation
        const playerName = validatePlayerName(body.playerName);
        if (!playerName) {
            return NextResponse.json(
                { error: "Invalid player name" },
                { status: 400 }
            );
        }

        // TODO: Implement actual Minecraft server integration
        // Example using RCON:
        // const adminUsername = session.user?.mcUsername; // You'd need to store this
        // if (!adminUsername) {
        //     return NextResponse.json(
        //         { error: "No Minecraft username linked to your account" },
        //         { status: 400 }
        //     );
        // }
        // 
        // const rconClient = await connectRcon(MINECRAFT_SERVER);
        // await rconClient.send(`tp ${adminUsername} ${playerName}`);
        // 
        // Or using a plugin API:
        // await fetch(`${MINECRAFT_API}/teleport`, {
        //     method: "POST",
        //     body: JSON.stringify({ 
        //         admin: adminUsername, 
        //         target: playerName 
        //     }),
        // });

        // Audit logging
        console.log(`[Teleport API] Admin ${session.user?.name} teleported to player: ${playerName}`);

        return NextResponse.json({
            success: true,
            message: `Teleporting to ${playerName}...`,
            playerName,
        });
    } catch (error: any) {
        console.error("[Teleport API] Error:", error);
        return NextResponse.json(
            { error: "Failed to teleport" },
            { status: 500 }
        );
    }
}

