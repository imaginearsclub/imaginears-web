import { NextRequest, NextResponse } from "next/server";
import { processMinecraftWebhook, type MinecraftWebhookPayload } from "@/lib/minecraft-analytics";

/**
 * POST /api/minecraft/analytics
 * 
 * Webhook endpoint for Minecraft Player Analytics Plugin
 * 
 * Configure your Minecraft plugin to send player data to this endpoint
 * 
 * Authentication options:
 * 1. API key in Authorization header
 * 2. Shared secret in X-Minecraft-Secret header
 * 3. IP whitelist
 * 
 * Example payload:
 * {
 *   "event": "bulk_sync",
 *   "timestamp": "2025-10-26T12:00:00Z",
 *   "server": "imaginears-main",
 *   "data": [
 *     {
 *       "uuid": "069a79f4-44e9-4726-a5be-fca90e38aaf5",
 *       "name": "Notch",
 *       "playtime": 12000,
 *       "sessions": 150,
 *       "lastSeen": "2025-10-26T12:00:00Z",
 *       "firstJoin": "2023-01-01T00:00:00Z"
 *     }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication (basic example - enhance for production)
    const authHeader = req.headers.get("authorization");
    const secretHeader = req.headers.get("x-minecraft-secret");
    const expectedSecret = process.env["MINECRAFT_WEBHOOK_SECRET"];

    // Simple authentication check
    if (expectedSecret && secretHeader !== expectedSecret) {
      console.warn("[Minecraft Webhook] Invalid secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse payload
    const payload: MinecraftWebhookPayload = await req.json();

    // Validate payload
    if (!payload.event || !payload.data) {
      return NextResponse.json(
        { error: "Invalid payload: missing event or data" },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await processMinecraftWebhook(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[Minecraft Webhook] Processing error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

