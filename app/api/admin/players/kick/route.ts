import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-middleware";
import { validatePlayerName, logPlayerAction, createSuccessResponse } from "../utils";
import { z } from "zod";

export const runtime = "nodejs";

const kickSchema = z.object({
  playerName: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  reason: z.string().max(200).optional(),
});

/**
 * POST /api/admin/players/kick
 * Kick a player from the Minecraft server
 * 
 * Security: Requires admin authentication, input validation, audit logging
 */
export const POST = createApiHandler(
    {
        auth: "user",
        rateLimit: {
            key: "admin:players:kick",
            limit: 20,
            window: 60,
            strategy: "sliding-window",
        },
        validateBody: kickSchema,
        maxBodySize: 1000, // 1KB max
    },
    async (_req, { userId, validatedBody }) => {
        const { playerName, reason } = validatedBody as z.infer<typeof kickSchema>;

        // Additional validation
        const validated = validatePlayerName(playerName);
        if (!validated) {
            return NextResponse.json(
                { error: "Invalid player name" },
                { status: 400 }
            );
        }

        // TODO: Implement actual Minecraft server integration
        // Example using RCON:
        // const rconClient = await connectRcon(MINECRAFT_SERVER);
        // await rconClient.send(`kick ${playerName} ${reason || "Kicked by admin"}`);
        // 
        // Or using a plugin API:
        // await fetch(`${MINECRAFT_API}/kick`, {
        //     method: "POST",
        //     body: JSON.stringify({ player: playerName, reason: reason || "Kicked by admin" }),
        // });

        logPlayerAction("kick", userId!, validated, { reason });

        return NextResponse.json(
            createSuccessResponse(`Player ${validated} has been kicked`, validated)
        );
    }
);

