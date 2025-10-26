/**
 * WebSocket Event Types
 * 
 * Centralized event definitions for real-time communication
 * between server and clients.
 */

// ============================================================================
// Client -> Server Events
// ============================================================================

export interface ClientEvents {
  // Connection
  "client:connect": { userId: string; token: string };
  "client:disconnect": {};
  "client:ping": { timestamp: number };

  // Subscriptions
  "client:subscribe": { channels: string[] };
  "client:unsubscribe": { channels: string[] };

  // Notifications
  "client:notification:read": { notificationId: string };
  "client:notification:archive": { notificationId: string };
}

// ============================================================================
// Server -> Client Events
// ============================================================================

export interface ServerEvents {
  // Connection
  "server:connected": { clientId: string; timestamp: number };
  "server:pong": { timestamp: number };
  "server:error": { code: string; message: string };

  // Notifications (Feature Flag: ENABLE_REALTIME_NOTIFICATIONS)
  "notification:new": {
    id: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    category: string;
    actionUrl?: string;
    actionText?: string;
    createdAt: string;
  };
  "notification:read": { notificationId: string };
  "notification:archived": { notificationId: string };
  "notification:count": { unreadCount: number };

  // Minecraft Server (Feature Flag: ENABLE_MINECRAFT_EVENTS)
  "minecraft:player:join": { username: string; uuid: string; timestamp: number };
  "minecraft:player:leave": { username: string; uuid: string; timestamp: number };
  "minecraft:player:count": { online: number; max: number };
  "minecraft:server:status": { online: boolean; players: number };
  "minecraft:chat": { username: string; message: string; timestamp: number };

  // Discord Bot (Feature Flag: ENABLE_DISCORD_EVENTS)
  "discord:message": { channelId: string; author: string; content: string; timestamp: number };
  "discord:member:join": { userId: string; username: string; timestamp: number };
  "discord:member:leave": { userId: string; username: string; timestamp: number };

  // System Updates (Feature Flag: ENABLE_SYSTEM_EVENTS)
  "system:maintenance": { scheduled: boolean; startTime: string; duration: number };
  "system:announcement": { title: string; message: string; priority: string };
  "system:update": { version: string; changes: string[] };

  // Live Data (Feature Flag: ENABLE_LIVE_DATA)
  "data:event:update": { eventId: string; changes: Record<string, any> };
  "data:player:update": { playerId: string; changes: Record<string, any> };
  "data:session:update": { sessionId: string; changes: Record<string, any> };
}

// ============================================================================
// Event Channels (for subscription-based filtering)
// ============================================================================

export const CHANNELS = {
  // Global channels
  NOTIFICATIONS: "notifications",
  SYSTEM: "system",

  // Minecraft channels
  MINECRAFT_PLAYERS: "minecraft:players",
  MINECRAFT_CHAT: "minecraft:chat",
  MINECRAFT_STATUS: "minecraft:status",

  // Discord channels
  DISCORD_MESSAGES: "discord:messages",
  DISCORD_MEMBERS: "discord:members",

  // Admin-only channels
  ADMIN_EVENTS: "admin:events",
  ADMIN_ANALYTICS: "admin:analytics",
  ADMIN_LOGS: "admin:logs",
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];

// ============================================================================
// Feature Flags (Enable/Disable specific WebSocket features)
// ============================================================================

export interface WebSocketFeatureFlags {
  ENABLE_REALTIME_NOTIFICATIONS: boolean;
  ENABLE_MINECRAFT_EVENTS: boolean;
  ENABLE_DISCORD_EVENTS: boolean;
  ENABLE_SYSTEM_EVENTS: boolean;
  ENABLE_LIVE_DATA: boolean;
  ENABLE_ADMIN_CHANNELS: boolean;
}

export const DEFAULT_FEATURE_FLAGS: WebSocketFeatureFlags = {
  ENABLE_REALTIME_NOTIFICATIONS: false, // Enable when ready
  ENABLE_MINECRAFT_EVENTS: false,       // Enable when Minecraft integration is ready
  ENABLE_DISCORD_EVENTS: false,         // Enable when Discord bot is ready
  ENABLE_SYSTEM_EVENTS: true,           // Safe to enable now
  ENABLE_LIVE_DATA: false,              // Enable when needed
  ENABLE_ADMIN_CHANNELS: true,          // Admin features
};

// ============================================================================
// WebSocket Message Structure
// ============================================================================

export interface WebSocketMessage<T extends keyof ServerEvents = keyof ServerEvents> {
  type: T;
  data: ServerEvents[T];
  timestamp: number;
  channel?: Channel;
}

// ============================================================================
// Connection State
// ============================================================================

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export interface ConnectionInfo {
  state: ConnectionState;
  clientId?: string;
  connectedAt?: number;
  lastPingAt?: number;
  reconnectAttempts: number;
  subscribedChannels: Channel[];
}

