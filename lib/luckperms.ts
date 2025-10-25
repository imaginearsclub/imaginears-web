/**
 * LuckPerms Integration Utility
 * 
 * This utility provides functions to interact with your Minecraft server's LuckPerms plugin.
 * You can use this to:
 * - Validate Minecraft usernames exist on the server
 * - Check player permissions/groups
 * - Sync roles between your web app and Minecraft server
 * 
 * SETUP OPTIONS:
 * 
 * Option 1 - Direct Database Access (Current):
 * 1. Add MINECRAFT_DATABASE_URL to your .env file
 * 2. Run: npm run prisma:minecraft:generate
 * 3. Run: npm run prisma:minecraft:db:pull (to sync schema)
 * 4. Use database functions: validateMinecraftUsernameDb(), etc.
 * 
 * Option 2 - REST API (Future):
 * 1. Install LuckPerms REST API plugin on your server
 * 2. Add LUCKPERMS_API_URL and LUCKPERMS_API_KEY to your .env
 * 3. Use API functions: getPlayerPermissions(), syncRoleToMinecraft()
 */

import { minecraftPrisma, isMinecraftDbConfigured } from "./prisma-minecraft";

const LUCKPERMS_API_URL = process.env['LUCKPERMS_API_URL'];
const LUCKPERMS_API_KEY = process.env['LUCKPERMS_API_KEY'];

/**
 * Check if LuckPerms integration is configured
 */
export function isLuckPermsEnabled(): boolean {
  return Boolean(LUCKPERMS_API_URL && LUCKPERMS_API_KEY);
}

/**
 * Validate a Minecraft username exists on the server
 * This could be done via:
 * - LuckPerms REST API
 * - Direct MySQL database query to LuckPerms tables
 * - Mojang API to check if username exists
 */
export async function validateMinecraftUsername(username: string): Promise<{
  valid: boolean;
  uuid?: string;
  error?: string;
}> {
  try {
    // Validate format first
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      return {
        valid: false,
        error: "Invalid username format (3-16 characters, alphanumeric and underscores only)",
      };
    }

    // Option 1: Check via Mojang API (doesn't require LuckPerms)
    const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          error: "Minecraft username not found",
        };
      }
      throw new Error(`Mojang API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      valid: true,
      uuid: data.id,
    };

    // Option 2: Check via LuckPerms API (uncomment if you have LuckPerms REST API)
    /*
    if (!isLuckPermsEnabled()) {
      return {
        valid: true, // Allow if LuckPerms is not configured
      };
    }

    const response = await fetch(`${LUCKPERMS_API_URL}/user/${username}`, {
      headers: {
        "Authorization": `Bearer ${LUCKPERMS_API_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: "Username not found on server",
      };
    }

    const data = await response.json();
    
    return {
      valid: true,
      uuid: data.uuid,
    };
    */
  } catch (error) {
    console.error("[LuckPerms] Error validating username:", error);
    return {
      valid: true, // Fail open - don't block user creation if API is down
      error: "Could not validate username (allowing anyway)",
    };
  }
}

/**
 * Get a player's permissions from LuckPerms
 * Useful for checking what permissions they have on the server
 */
export async function getPlayerPermissions(username: string): Promise<{
  success: boolean;
  groups?: string[];
  permissions?: string[];
  error?: string;
}> {
  if (!isLuckPermsEnabled()) {
    return {
      success: false,
      error: "LuckPerms integration not configured",
    };
  }

  try {
    const response = await fetch(`${LUCKPERMS_API_URL}/user/${username}`, {
      headers: {
        "Authorization": `Bearer ${LUCKPERMS_API_KEY}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      groups: data.groups || [],
      permissions: data.permissions || [],
    };
  } catch (error) {
    console.error("[LuckPerms] Error getting player permissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync a staff member's role to their Minecraft permissions
 * This could add them to groups like "staff", "moderator", "admin" on the server
 */
export async function syncRoleToMinecraft(
  minecraftName: string,
  webRole: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (!isLuckPermsEnabled()) {
    return {
      success: false,
      error: "LuckPerms integration not configured",
    };
  }

  try {
    // Map web roles to Minecraft groups
    const roleMapping: Record<string, string> = {
      "OWNER": "owner",
      "ADMIN": "admin",
      "MODERATOR": "moderator",
      "STAFF": "staff",
      "USER": "default",
    };

    const minecraftGroup = roleMapping[webRole] || "default";

    // Option: Use LuckPerms REST API to add user to group
    const response = await fetch(`${LUCKPERMS_API_URL}/user/${minecraftName}/group`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LUCKPERMS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        group: minecraftGroup,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to sync role: ${response.status}`,
      };
    }

    return {
      success: true,
      message: `Added ${minecraftName} to ${minecraftGroup} group on Minecraft server`,
    };
  } catch (error) {
    console.error("[LuckPerms] Error syncing role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all players with a specific permission/group
 * Useful for finding all staff members on the server
 */
export async function getPlayersWithGroup(groupName: string): Promise<{
  success: boolean;
  players?: string[];
  error?: string;
}> {
  if (!isLuckPermsEnabled()) {
    return {
      success: false,
      error: "LuckPerms integration not configured",
    };
  }

  try {
    const response = await fetch(`${LUCKPERMS_API_URL}/group/${groupName}/members`, {
      headers: {
        "Authorization": `Bearer ${LUCKPERMS_API_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      players: data.members || [],
    };
  } catch (error) {
    console.error("[LuckPerms] Error getting group members:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// DATABASE-BASED FUNCTIONS (Direct LuckPerms MySQL Access)
// ============================================================================

/**
 * Validate a Minecraft username exists in the LuckPerms database
 * This is the primary method when using direct database access
 */
export async function validateMinecraftUsernameDb(username: string): Promise<{
  valid: boolean;
  uuid?: string;
  primaryGroup?: string;
  error?: string;
}> {
  try {
    // Validate format first
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
      return {
        valid: false,
        error: "Invalid username format (3-16 characters, alphanumeric and underscores only)",
      };
    }

    if (!isMinecraftDbConfigured()) {
      return {
        valid: false,
        error: "Minecraft database not configured",
      };
    }

    // Query LuckPerms players table
    const player = await minecraftPrisma.luckPermsPlayer.findFirst({
      where: {
        username: username, // MySQL is case-insensitive by default
      },
      select: {
        uuid: true,
        username: true,
        primaryGroup: true,
      },
    });

    if (!player) {
      return {
        valid: false,
        error: "Player not found in LuckPerms database",
      };
    }

    return {
      valid: true,
      uuid: player.uuid,
      primaryGroup: player.primaryGroup,
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error validating username:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

/**
 * Get a player's permissions and groups from the database
 */
export async function getPlayerPermissionsDb(username: string): Promise<{
  success: boolean;
  uuid?: string;
  primaryGroup?: string;
  permissions?: Array<{
    permission: string;
    value: boolean;
    server: string;
    world: string;
  }>;
  groups?: string[];
  error?: string;
}> {
  try {
    if (!isMinecraftDbConfigured()) {
      return {
        success: false,
        error: "Minecraft database not configured",
      };
    }

    // First, find the player
    const player = await minecraftPrisma.luckPermsPlayer.findFirst({
      where: {
        username: username,
      },
      include: {
        permissions: {
          where: {
            OR: [
              { expiry: 0 }, // Permanent permissions
              { expiry: { gt: Math.floor(Date.now() / 1000) } }, // Not expired (Unix timestamp in seconds)
            ],
          },
        },
      },
    });

    if (!player) {
      return {
        success: false,
        error: "Player not found in database",
      };
    }

    // Get group memberships from permissions (group.X permissions)
    const groupPermissions = player.permissions.filter((p: { permission: string }) => 
      p.permission.startsWith('group.')
    );
    
    const groups = groupPermissions
      .filter((p: { value: boolean }) => p.value) // Only included groups (not negated)
      .map((p: { permission: string }) => p.permission.replace('group.', ''));

    return {
      success: true,
      uuid: player.uuid,
      primaryGroup: player.primaryGroup,
      groups: [player.primaryGroup, ...groups].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i), // Dedupe
      permissions: player.permissions
        .filter((p: { permission: string }) => !p.permission.startsWith('group.')) // Exclude group memberships
        .map((p: { permission: string; value: boolean; server: string; world: string }) => ({
          permission: p.permission,
          value: p.value,
          server: p.server,
          world: p.world,
        })),
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error getting player permissions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

/**
 * Get all players in a specific group from the database
 */
export async function getPlayersInGroupDb(groupName: string): Promise<{
  success: boolean;
  players?: Array<{
    uuid: string;
    username: string;
    primaryGroup: string;
  }>;
  error?: string;
}> {
  try {
    if (!isMinecraftDbConfigured()) {
      return {
        success: false,
        error: "Minecraft database not configured",
      };
    }

    // Get all players with this group as primary
    const primaryGroupPlayers = await minecraftPrisma.luckPermsPlayer.findMany({
      where: {
        primaryGroup: groupName,
      },
      select: {
        uuid: true,
        username: true,
        primaryGroup: true,
      },
    });

    // Get all players with this group via permission
    const groupPermPlayers = await minecraftPrisma.luckPermsUserPermission.findMany({
      where: {
        permission: `group.${groupName}`,
        value: true,
        OR: [
          { expiry: 0 },
          { expiry: { gt: Math.floor(Date.now() / 1000) } },
        ],
      },
      include: {
        player: {
          select: {
            uuid: true,
            username: true,
            primaryGroup: true,
          },
        },
      },
    });

    // Combine and deduplicate
    const allPlayers = [
      ...primaryGroupPlayers,
      ...groupPermPlayers.map((p: { player: { uuid: string; username: string; primaryGroup: string } }) => p.player),
    ];

    const uniquePlayers = Array.from(
      new Map(allPlayers.map(p => [p.uuid, p])).values()
    );

    return {
      success: true,
      players: uniquePlayers,
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error getting players in group:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

/**
 * Check if a player has a specific permission in the database
 */
export async function playerHasPermissionDb(
  username: string,
  permission: string
): Promise<{
  success: boolean;
  hasPermission?: boolean;
  error?: string;
}> {
  try {
    if (!isMinecraftDbConfigured()) {
      return {
        success: false,
        error: "Minecraft database not configured",
      };
    }

    const player = await minecraftPrisma.luckPermsPlayer.findFirst({
      where: {
        username: username,
      },
      include: {
        permissions: {
          where: {
            permission: permission,
            OR: [
              { expiry: 0 },
              { expiry: { gt: Math.floor(Date.now() / 1000) } },
            ],
          },
        },
      },
    });

    if (!player) {
      return {
        success: false,
        error: "Player not found",
      };
    }

    // Check user-specific permissions
    const userPerm = player.permissions.find((p: { permission: string }) => p.permission === permission);
    if (userPerm) {
      return {
        success: true,
        hasPermission: userPerm.value,
      };
    }

    // TODO: Check group permissions (requires more complex logic with inheritance)
    // For now, just return false if no user-specific permission found
    return {
      success: true,
      hasPermission: false,
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error checking permission:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

/**
 * Get all groups from the database
 */
export async function getAllGroupsDb(): Promise<{
  success: boolean;
  groups?: Array<{
    name: string;
    displayName: string | null;
    weight: number;
    playerCount?: number;
  }>;
  error?: string;
}> {
  try {
    if (!isMinecraftDbConfigured()) {
      return {
        success: false,
        error: "Minecraft database not configured",
      };
    }

    const groups = await minecraftPrisma.luckPermsGroup.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    // Get player counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group: { name: string }) => {
        const primaryCount = await minecraftPrisma.luckPermsPlayer.count({
          where: { primaryGroup: group.name },
        });

        return {
          name: group.name,
          displayName: null, // Not available in this LuckPerms version
          weight: 0, // Not available in this LuckPerms version
          playerCount: primaryCount,
        };
      })
    );

    return {
      success: true,
      groups: groupsWithCounts,
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error getting groups:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

/**
 * Search for players by username pattern
 */
export async function searchPlayersDb(searchQuery: string): Promise<{
  success: boolean;
  players?: Array<{
    uuid: string;
    username: string;
    primaryGroup: string;
  }>;
  error?: string;
}> {
  try {
    if (!isMinecraftDbConfigured()) {
      return {
        success: false,
        error: "Minecraft database not configured",
      };
    }

    if (searchQuery.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
      };
    }

    const players = await minecraftPrisma.luckPermsPlayer.findMany({
      where: {
        username: {
          contains: searchQuery,
        },
      },
      select: {
        uuid: true,
        username: true,
        primaryGroup: true,
      },
      take: 50, // Limit results
      orderBy: {
        username: 'asc',
      },
    });

    return {
      success: true,
      players,
    };
  } catch (error) {
    console.error("[LuckPerms DB] Error searching players:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

