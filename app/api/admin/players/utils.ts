/**
 * Shared utilities for player API endpoints
 */

import { log } from "@/lib/logger";
import type { Permission } from "@/lib/rbac";

// Constants for player operations
export const MIN_PLAYER_NAME_LENGTH = 3;
export const MAX_PLAYER_NAME_LENGTH = 16;
export const PLAYER_NAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Validate Minecraft player name
 * @param name - Player name to validate
 * @returns Sanitized name or null if invalid
 */
export function validatePlayerName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  
  const sanitized = name.trim();
  
  // Check length
  if (sanitized.length < MIN_PLAYER_NAME_LENGTH || sanitized.length > MAX_PLAYER_NAME_LENGTH) {
    return null;
  }
  
  // Check format (alphanumeric and underscore only)
  if (!PLAYER_NAME_REGEX.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Log player action for audit trail
 * @param action - Action being performed
 * @param adminName - Admin performing the action
 * @param playerName - Target player name
 * @param additionalContext - Additional context for logging
 */
export function logPlayerAction(
  action: string,
  adminName: string,
  playerName: string,
  additionalContext?: Record<string, unknown>
): void {
  log.info("Player action performed", {
    action,
    adminName,
    playerName,
    ...additionalContext,
  });
}

/**
 * Create success response for player actions
 * @param message - Success message
 * @param playerName - Player name
 * @returns Formatted success response
 */
export function createSuccessResponse(message: string, playerName: string) {
  return {
    success: true,
    message,
    playerName,
  };
}

/**
 * Standard permissions required for different player actions
 */
export const PLAYER_PERMISSIONS = {
  LIST: "players:read" as Permission,
  TELEPORT: "players:write" as Permission,
  KICK: "players:ban" as Permission,
  MUTE: "players:write" as Permission,
} as const;

