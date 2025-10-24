/**
 * Minecraft Server Status Utility
 * 
 * Queries Minecraft server status using mcstatus.io API
 * More reliable than direct server queries and doesn't require deprecated packages
 */

const MCSTATUS_API = "https://api.mcstatus.io/v2/status/java";
const REQUEST_TIMEOUT_MS = 5000; // 5 second timeout

// Uptime tracking: Store last N checks per server
const MAX_UPTIME_HISTORY = 100; // Track last 100 checks
const MAX_PLAYER_HISTORY = 50; // Track last 50 player counts for graph
const uptimeHistory = new Map<string, boolean[]>();
const playerCountHistory = new Map<string, { timestamp: number; count: number }[]>();

/**
 * Track server check result for uptime calculation
 */
function trackUptimeCheck(serverAddress: string, wasOnline: boolean): void {
    let history = uptimeHistory.get(serverAddress);
    
    if (!history) {
        history = [];
        uptimeHistory.set(serverAddress, history);
    }
    
    history.push(wasOnline);
    
    // Keep only the last MAX_UPTIME_HISTORY checks
    if (history.length > MAX_UPTIME_HISTORY) {
        history.shift();
    }
}

/**
 * Track player count for graphing
 */
function trackPlayerCount(serverAddress: string, count: number): void {
    let history = playerCountHistory.get(serverAddress);
    
    if (!history) {
        history = [];
        playerCountHistory.set(serverAddress, history);
    }
    
    history.push({
        timestamp: Date.now(),
        count: count,
    });
    
    // Keep only the last MAX_PLAYER_HISTORY data points
    if (history.length > MAX_PLAYER_HISTORY) {
        history.shift();
    }
}

/**
 * Calculate uptime percentage based on recent checks
 * 
 * @param serverAddress - Server address
 * @returns Uptime percentage (0-100) or null if no history
 */
export function getUptimePercentage(serverAddress: string): number | null {
    const history = uptimeHistory.get(serverAddress);
    
    if (!history || history.length === 0) {
        return null;
    }
    
    const onlineCount = history.filter(status => status).length;
    return Math.round((onlineCount / history.length) * 100);
}

/**
 * Get player count history for graphing
 * 
 * @param serverAddress - Server address
 * @returns Array of player count data points
 */
export function getPlayerCountHistory(serverAddress: string): { timestamp: number; count: number }[] {
    return playerCountHistory.get(serverAddress) || [];
}

export type MinecraftServerStatus = {
    online: boolean;
    version?: string;
    playersOnline?: number;
    playersMax?: number;
    motd?: string;
    latency?: number;
    error?: string;
};

/**
 * Query Minecraft server status
 * 
 * @param serverAddress - Server address (e.g., "iears.us" or "iears.us:25565")
 * @returns Server status information
 */
export async function getMinecraftServerStatus(
    serverAddress: string
): Promise<MinecraftServerStatus> {
    try {
        // Security: Validate server address format
        const sanitizedAddress = serverAddress.replace(/[^a-zA-Z0-9.-:]/g, '');
        
        if (!sanitizedAddress || sanitizedAddress.length > 255) {
            return {
                online: false,
                error: "Invalid server address",
            };
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        // Measure our own request latency
        const requestStart = Date.now();

        try {
            const response = await fetch(`${MCSTATUS_API}/${sanitizedAddress}`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
                // Don't cache during development, short cache in production
                next: {
                    revalidate: process.env.NODE_ENV === 'production' ? 60 : 0,
                },
            });

            const requestLatency = Date.now() - requestStart;
            clearTimeout(timeoutId);

            if (!response.ok) {
                return {
                    online: false,
                    error: `API returned ${response.status}`,
                };
            }

            const data = await response.json();

            // Parse mcstatus.io response
            const isOnline = data.online === true;
            const playersOnline = data.players?.online ?? 0;
            
            // Track uptime check
            trackUptimeCheck(sanitizedAddress, isOnline);
            
            // Track player count for graphing (only when online)
            if (isOnline) {
                trackPlayerCount(sanitizedAddress, playersOnline);
            }
            
            // Extract latency - prefer mcstatus.io's measurement, fallback to our request latency
            const apiLatency = data.latency ?? data.srv_record?.latency;
            const latency = typeof apiLatency === 'number' && apiLatency > 0 
                ? Math.round(apiLatency) 
                : requestLatency;
            
            // Debug logging in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[MC Status] ${sanitizedAddress}: online=${isOnline}, latency=${latency}ms (API: ${apiLatency}, Request: ${requestLatency}ms)`);
            }
            
            return {
                online: isOnline,
                version: data.version?.name_clean || data.version?.name_raw,
                playersOnline: playersOnline,
                playersMax: data.players?.max,
                motd: data.motd?.clean?.[0] || data.motd?.raw?.[0],
                latency: latency,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        // Track failed check as offline
        const sanitizedAddress = serverAddress.replace(/[^a-zA-Z0-9.-:]/g, '');
        if (sanitizedAddress && sanitizedAddress.length <= 255) {
            trackUptimeCheck(sanitizedAddress, false);
        }
        
        // Handle timeout or network errors
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    online: false,
                    error: "Request timeout",
                };
            }
            return {
                online: false,
                error: error.message,
            };
        }
        
        return {
            online: false,
            error: "Unknown error",
        };
    }
}

/**
 * Format uptime duration in a human-readable way
 * 
 * @param seconds - Uptime in seconds
 * @returns Formatted uptime string (e.g., "2d 5h" or "3h 42m")
 */
export function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

