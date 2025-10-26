/**
 * Minecraft Player Analytics Plugin - Web API Integration
 * 
 * Specifically designed for Plan Player Analytics with cookie-based auth
 * GitHub: https://github.com/plan-player-analytics/Plan
 */

import { syncMinecraftPlayers, type MinecraftPlayerData } from "./minecraft-analytics";

/**
 * Plan Player Analytics API Configuration
 * Set these in your .env file
 */
interface PlanConfig {
  apiUrl: string; // e.g., "https://your-server.com:8804" or "https://your-domain.com/plan"
  username: string; // Plan web panel username
  password: string; // Plan web panel password
  serverIdentifier?: string; // Server identifier (if multi-server)
}

/**
 * Session storage for Plan authentication cookies
 * In production, use Redis or database to store this
 */
let planSessionCookies: string | null = null;
let sessionExpiry: number = 0;

/**
 * Get config from environment variables
 */
function getConfig(): PlanConfig {
  const serverIdentifier = process.env["PLAN_SERVER_IDENTIFIER"];
  const config: PlanConfig = {
    apiUrl: process.env["PLAN_API_URL"] || "",
    username: process.env["PLAN_USERNAME"] || "",
    password: process.env["PLAN_PASSWORD"] || "",
  };
  
  if (serverIdentifier) {
    config.serverIdentifier = serverIdentifier;
  }
  
  return config;
}

/**
 * Authenticate with Plan and get session cookies
 */
async function authenticateWithPlan(): Promise<string> {
  const config = getConfig();

  if (!config.apiUrl || !config.username || !config.password) {
    throw new Error("Plan credentials not configured in .env");
  }

  try {
    // Plan login endpoint
    const loginUrl = `${config.apiUrl}/auth/login`;

    // Plan expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams();
    formData.append("user", config.username);
    formData.append("password", config.password);

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Plan authentication failed: ${response.status} ${response.statusText}`
      );
    }

    // Extract cookies from Set-Cookie header
    const setCookieHeader = response.headers.get("set-cookie");
    
    if (!setCookieHeader) {
      throw new Error("No session cookies received from Plan");
    }

    // Parse cookies - extract only the cookie name=value pairs, not the attributes
    // Format: "name=value; Path=/; HttpOnly; ..." -> "name=value"
    const cookieParts = setCookieHeader.split(';').map(part => part.trim());
    const cookieValue = cookieParts[0];
    
    if (!cookieValue) {
      throw new Error("Failed to parse session cookie from Plan");
    }

    // Store cookies and set expiry (Plan sessions typically last 24 hours)
    planSessionCookies = cookieValue;
    sessionExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours to be safe

    return cookieValue;
  } catch (error) {
    console.error("[Plan API] Authentication error:", error);
    throw error;
  }
}

/**
 * Get valid session cookies (re-authenticate if expired)
 */
async function getSessionCookies(): Promise<string> {
  // If no cookies or expired, re-authenticate
  if (!planSessionCookies || Date.now() >= sessionExpiry) {
    return await authenticateWithPlan();
  }

  return planSessionCookies;
}

/**
 * Fetch player data from Plan API
 */
export async function fetchPlayersFromAPI(): Promise<MinecraftPlayerData[]> {
  const config = getConfig();

  if (!config.apiUrl) {
    throw new Error("PLAN_API_URL not configured");
  }

  try {
    // Get authenticated session
    const cookies = await getSessionCookies();

    // Plan players endpoint
    // For single-server or network-wide: /v1/playersTable
    // For specific server in network: /v1/server/{serverIdentifier}/playersTable
    const endpoint = config.serverIdentifier 
      ? `/v1/server/${config.serverIdentifier}/playersTable`
      : `/v1/playersTable`;
    
    const url = `${config.apiUrl}${endpoint}`;

    // For GET requests, don't send Content-Type header
    const headers: HeadersInit = {
      "Cookie": cookies,
    };

    const response = await fetch(url, { headers });

    if (response.status === 401 || response.status === 403) {
      // Session might have expired, try re-authenticating once
      const newCookies = await authenticateWithPlan();
      
      const retryResponse = await fetch(url, {
        headers: {
          "Cookie": newCookies,
        },
      });

      if (!retryResponse.ok) {
        throw new Error(
          `Failed to fetch players after re-auth: ${retryResponse.status} ${retryResponse.statusText}`
        );
      }

      const data = await retryResponse.json();
      return transformPlanResponse(data);
    }

    if (!response.ok) {
      // Log response details for debugging
      const responseText = await response.text();
      console.error(`[Plan API] Response status: ${response.status} ${response.statusText}`);
      console.error(`[Plan API] Response body: ${responseText}`);
      throw new Error(
        `Failed to fetch players: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return transformPlanResponse(data);
  } catch (error) {
    console.error("[Plan API] Failed to fetch players:", error);
    throw error;
  }
}

/**
 * Transform Plan API response to our MinecraftPlayerData format
 * 
 * Plan API v1 (new) response format:
 * {
 *   "players": [
 *     {
 *       "playerUUID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
 *       "playerName": "string",
 *       "playtimeActive": 0, // milliseconds
 *       "sessionCount": 0,
 *       "lastSeen": 0, // unix timestamp (milliseconds)
 *       "registered": 0, // unix timestamp (milliseconds)
 *       "activityIndex": 0,
 *       ...
 *     }
 *   ]
 * }
 */
function transformPlanResponse(apiData: any): MinecraftPlayerData[] {
  // Plan API wraps data in a "players" array
  const players = apiData.players || apiData.data || apiData;

  if (!Array.isArray(players)) {
    console.warn("[Plan API] Unexpected API response format:", apiData);
    return [];
  }

  return players.map((player: any) => {
    // Support both new and old Plan API formats
    const uuid = player.playerUUID || player.uuid;
    const name = player.playerName || player.name;
    
    // Convert playtime from milliseconds to minutes
    // New format: playtimeActive, Old format: playtime or active_playtime
    const playtimeMinutes = player.playtimeActive
      ? Math.floor(player.playtimeActive / 1000 / 60)
      : player.playtime
      ? Math.floor(player.playtime / 1000 / 60)
      : player.active_playtime
      ? Math.floor(player.active_playtime / 1000 / 60)
      : 0;

    // Convert timestamps from milliseconds to ISO strings
    // New format: lastSeen, Old format: last_seen
    const lastSeenDate =
      player.lastSeen || player.last_seen
        ? new Date(player.lastSeen || player.last_seen)
        : new Date();

    // New format: registered, Old format: registered or first_join
    const firstJoinDate =
      player.registered || player.first_join
        ? new Date(player.registered || player.first_join)
        : new Date();

    return {
      uuid: uuid,
      name: name,
      playtime: playtimeMinutes,
      sessions: player.sessionCount || player.session_count || player.sessions || 0,
      lastSeen: lastSeenDate.toISOString(),
      firstJoin: firstJoinDate.toISOString(),
      // Optional Plan-specific fields
      deaths: player.deaths,
      mobKills: player.mobKills || player.mob_kills,
      playerKills: player.playerKills || player.player_kills,
      favoriteWorld: player.favoriteWorld || player.favorite_world,
      averageSessionLength: player.avgSessionLength || player.average_session_length,
    };
  });
}

/**
 * Sync all players from the API
 * This can be called from a cron job or admin action
 */
export async function syncPlayersFromAPI(): Promise<{
  success: boolean;
  synced: number;
  errors: number;
  linked: number;
  message: string;
}> {
  try {
    const players = await fetchPlayersFromAPI();

    if (players.length === 0) {
      return {
        success: true,
        synced: 0,
        errors: 0,
        linked: 0,
        message: "No players found in API response",
      };
    }

    const result = await syncMinecraftPlayers(players);

    return {
      success: true,
      synced: result.synced,
      errors: result.errors,
      linked: result.linked,
      message: `Successfully synced ${result.synced} players (${result.linked} linked to accounts)`,
    };
  } catch (error) {
    console.error("[MC API] Sync failed:", error);
    return {
      success: false,
      synced: 0,
      errors: 1,
      linked: 0,
      message: `Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Fetch a single player from Plan API
 */
export async function fetchPlayerFromAPI(
  uuidOrName: string
): Promise<MinecraftPlayerData | null> {
  const config = getConfig();

  if (!config.apiUrl) {
    throw new Error("PLAN_API_URL not configured");
  }

  try {
    const cookies = await getSessionCookies();
    const url = `${config.apiUrl}/v1/player/${uuidOrName}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Cookie": cookies,
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(
        `Failed to fetch player: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const players = transformPlanResponse({ players: [data] });

    return players[0] || null;
  } catch (error) {
    console.error(`[Plan API] Failed to fetch player ${uuidOrName}:`, error);
    throw error;
  }
}

/**
 * Test the Plan API connection and authentication
 */
export async function testAPIConnection(): Promise<{
  success: boolean;
  message: string;
  playerCount?: number;
}> {
  const config = getConfig();

  if (!config.apiUrl) {
    return {
      success: false,
      message: "PLAN_API_URL not configured. Add to your .env file.",
    };
  }

  if (!config.username || !config.password) {
    return {
      success: false,
      message: "PLAN_USERNAME or PLAN_PASSWORD not configured. Add to your .env file.",
    };
  }

  try {
    // Test authentication first
    await authenticateWithPlan();

    // If auth succeeds, try fetching players
    const players = await fetchPlayersFromAPI();

    return {
      success: true,
      message: "Plan API connection successful! Authentication working.",
      playerCount: players.length,
    };
  } catch (error) {
    // Clear stored cookies on failure
    planSessionCookies = null;
    sessionExpiry = 0;

    return {
      success: false,
      message: `Plan API connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}