/**
 * Minecraft Analytics Integration
 * 
 * Integration with Minecraft Player Analytics Plugin
 * Syncs player data from Minecraft server to web analytics
 */

import { syncMinecraftPlayerData } from "./analytics";
import { prisma } from "./prisma";

/**
 * Player data from Minecraft Player Analytics Plugin
 */
export interface MinecraftPlayerData {
  uuid: string; // Minecraft UUID
  name: string; // Minecraft username
  playtime: number; // Total playtime in minutes
  sessions: number; // Total join count
  lastSeen: string; // ISO date string
  firstJoin: string; // ISO date string
  // Additional fields your plugin might provide
  deaths?: number;
  mobKills?: number;
  playerKills?: number;
  favoriteWorld?: string;
  averageSessionLength?: number; // minutes
}

/**
 * Sync player data from Minecraft Player Analytics Plugin
 * 
 * This function can be called from:
 * 1. A webhook endpoint (when player data updates on MC server)
 * 2. A scheduled cron job (daily sync)
 * 3. Manual sync via admin panel
 * 
 * @param players - Array of player data from Minecraft plugin
 * @returns Summary of sync operation
 */
export async function syncMinecraftPlayers(
  players: MinecraftPlayerData[]
): Promise<{
  synced: number;
  errors: number;
  linked: number; // Players linked to website accounts
}> {
  let synced = 0;
  let errors = 0;
  let linked = 0;

  for (const player of players) {
    try {
      // Sync to PlayerAnalytics table
      await syncMinecraftPlayerData({
        minecraftUuid: player.uuid,
        minecraftName: player.name,
        totalPlaytime: player.playtime,
        totalJoins: player.sessions,
        lastJoin: new Date(player.lastSeen),
        firstJoin: new Date(player.firstJoin),
      });

      // Try to link to website user account
      // Note: Can't use mode: "insensitive" on nullable String fields in Prisma
      const user = await prisma.user.findFirst({
        where: {
          minecraftName: player.name,
        },
      });

      if (user) {
        // Link the PlayerAnalytics record to the user
        await prisma.playerAnalytics.updateMany({
          where: { minecraftUuid: player.uuid },
          data: { userId: user.id },
        });
        linked++;
      }

      synced++;
    } catch (error) {
      console.error(`[Minecraft Analytics] Failed to sync player ${player.name}:`, error);
      errors++;
    }
  }

  return { synced, errors, linked };
}

/**
 * Get Minecraft player data by UUID
 */
export async function getMinecraftPlayerByUuid(uuid: string) {
  return await prisma.playerAnalytics.findUnique({
    where: { minecraftUuid: uuid },
  });
}

/**
 * Get Minecraft player data by username
 */
export async function getMinecraftPlayerByName(name: string) {
  return await prisma.playerAnalytics.findFirst({
    where: {
      minecraftName: name,
    },
  });
}

/**
 * Get top players by playtime
 */
export async function getTopPlayersByPlaytime(limit: number = 10) {
  return await prisma.playerAnalytics.findMany({
    where: {
      totalMinecraftTime: { gt: 0 },
    },
    orderBy: { totalMinecraftTime: "desc" },
    take: limit,
  });
}

/**
 * Get online players count (if your plugin tracks this)
 * This would need a separate real-time tracking mechanism
 */
export async function getOnlinePlayersCount(): Promise<number> {
  // This is a placeholder - implement based on your setup
  // Options:
  // 1. Query Minecraft server status API
  // 2. WebSocket connection to server
  // 3. Last seen < 5 minutes ago
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return await prisma.playerAnalytics.count({
    where: {
      lastMinecraftJoin: {
        gte: fiveMinutesAgo,
      },
    },
  });
}

/**
 * Calculate player engagement trends
 */
export async function getPlayerEngagementTrends(days: number = 30): Promise<
  Array<{
    date: string;
    totalPlaytime: number;
    uniquePlayers: number;
    averageSessionLength: number;
  }>
> {
  // This would require storing daily snapshots or aggregating from session logs
  // For now, return a placeholder structure
  
  const trends: Array<{
    date: string;
    totalPlaytime: number;
    uniquePlayers: number;
    averageSessionLength: number;
  }> = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // TODO: Implement actual trend calculation
  // This would require either:
  // 1. Historical snapshots from your Player Analytics plugin
  // 2. Session-level data tracking
  // 3. Daily aggregation job

  return trends;
}

/**
 * Link Minecraft player to website user
 * (Manual linking via admin panel or user profile)
 */
export async function linkMinecraftToUser(
  minecraftUuid: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.playerAnalytics.updateMany({
      where: { minecraftUuid },
      data: { userId },
    });
    return true;
  } catch (error) {
    console.error("[Minecraft Analytics] Failed to link player:", error);
    return false;
  }
}

/**
 * Unlink Minecraft player from website user
 */
export async function unlinkMinecraftFromUser(minecraftUuid: string): Promise<boolean> {
  try {
    await prisma.playerAnalytics.updateMany({
      where: { minecraftUuid },
      data: { userId: null },
    });
    return true;
  } catch (error) {
    console.error("[Minecraft Analytics] Failed to unlink player:", error);
    return false;
  }
}

/**
 * Get players without linked accounts
 */
export async function getUnlinkedPlayers(limit: number = 50) {
  return await prisma.playerAnalytics.findMany({
    where: {
      userId: null,
      totalMinecraftTime: { gt: 60 }, // Only show players with > 1 hour playtime
    },
    orderBy: { totalMinecraftTime: "desc" },
    take: limit,
  });
}

/**
 * Webhook payload structure (adjust based on your plugin's format)
 */
export interface MinecraftWebhookPayload {
  event: "player_join" | "player_leave" | "player_data_update" | "bulk_sync";
  timestamp: string;
  server: string;
  data: MinecraftPlayerData | MinecraftPlayerData[];
}

/**
 * Process webhook from Minecraft Player Analytics Plugin
 */
export async function processMinecraftWebhook(
  payload: MinecraftWebhookPayload
): Promise<{ success: boolean; message: string }> {
  try {
    switch (payload.event) {
      case "player_join":
      case "player_leave":
      case "player_data_update": {
        const player = payload.data as MinecraftPlayerData;
        await syncMinecraftPlayers([player]);
        return {
          success: true,
          message: `Player ${player.name} data synced`,
        };
      }

      case "bulk_sync": {
        const players = payload.data as MinecraftPlayerData[];
        const result = await syncMinecraftPlayers(players);
        return {
          success: true,
          message: `Bulk sync complete: ${result.synced} synced, ${result.linked} linked, ${result.errors} errors`,
        };
      }

      default:
        return {
          success: false,
          message: `Unknown event type: ${payload.event}`,
        };
    }
  } catch (error) {
    console.error("[Minecraft Analytics] Webhook processing error:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

