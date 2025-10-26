/**
 * WebSocket Server Utilities
 * 
 * Server-side WebSocket management and broadcasting.
 * 
 * Note: This is a foundation/boilerplate. The actual WebSocket server
 * will need to be implemented using a custom server or external service.
 * 
 * For Next.js, consider:
 * - Using an external WebSocket server (separate Node.js process)
 * - Using a service like Pusher, Ably, or Socket.IO
 * - Using Server-Sent Events (SSE) as an alternative
 */

import type { WebSocketMessage, ServerEvents, Channel, WebSocketFeatureFlags } from "./websocket-events";
import { DEFAULT_FEATURE_FLAGS, CHANNELS } from "./websocket-events";

// Re-export CHANNELS for convenience
export { CHANNELS };

// ============================================================================
// Configuration
// ============================================================================

export const WEBSOCKET_CONFIG = {
  // Feature flags (can be overridden by environment variables)
  features: {
    ...DEFAULT_FEATURE_FLAGS,
    // Override from environment
    ['ENABLE_REALTIME_NOTIFICATIONS']: process.env['ENABLE_REALTIME_NOTIFICATIONS'] === "true",
    ['ENABLE_MINECRAFT_EVENTS']: process.env['ENABLE_MINECRAFT_EVENTS'] === "true",
    ['ENABLE_DISCORD_EVENTS']: process.env['ENABLE_DISCORD_EVENTS'] === "true",
  } as WebSocketFeatureFlags,

  // Connection settings
  pingInterval: 30000, // 30 seconds
  reconnectDelay: 3000, // 3 seconds
  maxReconnectAttempts: 5,

  // Rate limiting
  maxMessagesPerSecond: 10,
  maxChannelsPerClient: 50,
};

// ============================================================================
// Client Connection Management (To be implemented)
// ============================================================================

interface ConnectedClient {
  id: string;
  userId: string;
  subscribedChannels: Set<Channel>;
  connectedAt: number;
  lastPingAt: number;
  // WebSocket connection object would go here
  // ws?: WebSocket;
}

// In-memory client registry (use Redis in production)
const connectedClients = new Map<string, ConnectedClient>();

/**
 * Register a new client connection
 */
export function registerClient(clientId: string, userId: string): ConnectedClient {
  const client: ConnectedClient = {
    id: clientId,
    userId,
    subscribedChannels: new Set(),
    connectedAt: Date.now(),
    lastPingAt: Date.now(),
  };

  connectedClients.set(clientId, client);
  console.log(`[WebSocket] Client ${clientId} connected (User: ${userId})`);

  return client;
}

/**
 * Unregister a client connection
 */
export function unregisterClient(clientId: string): void {
  const client = connectedClients.get(clientId);
  if (client) {
    connectedClients.delete(clientId);
    console.log(`[WebSocket] Client ${clientId} disconnected`);
  }
}

/**
 * Subscribe client to channels
 */
export function subscribeToChannels(clientId: string, channels: Channel[]): void {
  const client = connectedClients.get(clientId);
  if (!client) return;

  for (const channel of channels) {
    if (client.subscribedChannels.size >= WEBSOCKET_CONFIG.maxChannelsPerClient) {
      console.warn(`[WebSocket] Client ${clientId} reached max channel limit`);
      break;
    }
    client.subscribedChannels.add(channel);
  }

  console.log(`[WebSocket] Client ${clientId} subscribed to:`, channels);
}

/**
 * Unsubscribe client from channels
 */
export function unsubscribeFromChannels(clientId: string, channels: Channel[]): void {
  const client = connectedClients.get(clientId);
  if (!client) return;

  for (const channel of channels) {
    client.subscribedChannels.delete(channel);
  }

  console.log(`[WebSocket] Client ${clientId} unsubscribed from:`, channels);
}

// ============================================================================
// Broadcasting (To be implemented with actual WebSocket library)
// ============================================================================

/**
 * Broadcast message to all connected clients
 */
export function broadcast<T extends keyof ServerEvents>(
  type: T,
  data: ServerEvents[T],
  options?: {
    channel?: Channel;
    userId?: string;
    excludeClient?: string;
  }
): void {
  // Feature flag check
  if (!isFeatureEnabled(type)) {
    console.log(`[WebSocket] Feature disabled for event: ${type}`);
    return;
  }

  const message: WebSocketMessage<T> = {
    type,
    data,
    timestamp: Date.now(),
    ...(options?.channel && { channel: options.channel }),
  };

  // Filter clients based on options
  const targetClients = Array.from(connectedClients.values()).filter((client) => {
    // Exclude specific client
    if (options?.excludeClient && client.id === options.excludeClient) {
      return false;
    }

    // Filter by user ID
    if (options?.userId && client.userId !== options.userId) {
      return false;
    }

    // Filter by channel subscription
    if (options?.channel && !client.subscribedChannels.has(options.channel)) {
      return false;
    }

    return true;
  });

  console.log(`[WebSocket] Broadcasting ${type} to ${targetClients.length} clients`);

  // TODO: Implement actual WebSocket send
  // For now, just log
  targetClients.forEach((client) => {
    // client.ws?.send(JSON.stringify(message));
    console.log(`[WebSocket] Would send to client ${client.id}:`, message);
  });
}

/**
 * Send message to specific user
 */
export function sendToUser<T extends keyof ServerEvents>(
  userId: string,
  type: T,
  data: ServerEvents[T],
  channel?: Channel
): void {
  broadcast(type, data, {
    userId,
    ...(channel && { channel }),
  });
}

/**
 * Send message to specific client
 */
export function sendToClient<T extends keyof ServerEvents>(
  clientId: string,
  type: T,
  data: ServerEvents[T]
): void {
  const client = connectedClients.get(clientId);
  if (!client) {
    console.warn(`[WebSocket] Client ${clientId} not found`);
    return;
  }

  const message: WebSocketMessage<T> = {
    type,
    data,
    timestamp: Date.now(),
  };

  // TODO: Implement actual WebSocket send
  console.log(`[WebSocket] Would send to client ${clientId}:`, message);
}

// ============================================================================
// Feature Flag Helpers
// ============================================================================

function isFeatureEnabled(eventType: string): boolean {
  if (eventType.startsWith("notification:")) {
    return WEBSOCKET_CONFIG.features.ENABLE_REALTIME_NOTIFICATIONS;
  }
  if (eventType.startsWith("minecraft:")) {
    return WEBSOCKET_CONFIG.features.ENABLE_MINECRAFT_EVENTS;
  }
  if (eventType.startsWith("discord:")) {
    return WEBSOCKET_CONFIG.features.ENABLE_DISCORD_EVENTS;
  }
  if (eventType.startsWith("system:")) {
    return WEBSOCKET_CONFIG.features.ENABLE_SYSTEM_EVENTS;
  }
  if (eventType.startsWith("data:")) {
    return WEBSOCKET_CONFIG.features.ENABLE_LIVE_DATA;
  }
  return true; // Allow unlisted events
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get connected client count
 */
export function getConnectedClientCount(): number {
  return connectedClients.size;
}

/**
 * Get clients by user ID
 */
export function getClientsByUserId(userId: string): ConnectedClient[] {
  return Array.from(connectedClients.values()).filter((client) => client.userId === userId);
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return getClientsByUserId(userId).length > 0;
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up inactive connections (run periodically)
 */
export function cleanupInactiveConnections(timeoutMs: number = 60000): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [clientId, client] of connectedClients.entries()) {
    if (now - client.lastPingAt > timeoutMs) {
      unregisterClient(clientId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[WebSocket] Cleaned up ${cleaned} inactive connections`);
  }

  return cleaned;
}

