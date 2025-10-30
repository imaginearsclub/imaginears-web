/**
 * Shared utilities for application validation and queries
 * 
 * Implements DRY principles for application CRUD operations
 */

import { AppStatus } from "@prisma/client";
import { validateEmail, validateMinecraftName, MAX_LENGTHS, MIN_LENGTHS } from "@/lib/input-validation";

/**
 * Application validation result type
 */
export type ApplicationValidationResult<T> = 
  | { valid: true; data: T } 
  | { valid: false; error: string };

/**
 * Validate application name
 */
export function validateApplicationName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_LENGTHS.NAME) return null;
  return trimmed;
}

/**
 * Validate application email
 */
export function validateApplicationEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const emailValidation = validateEmail(trimmed);
  if (!emailValidation.valid) return null;
  return trimmed;
}

/**
 * Validate Minecraft username for applications
 * Returns null if empty or invalid, returns valid string otherwise
 */
export function validateApplicationMcUsername(mcUsername: unknown): string | null {
  if (typeof mcUsername !== "string") return null;
  const trimmed = mcUsername.trim();
  
  // Empty is valid (optional field)
  if (trimmed.length === 0) return null;
  
  // Validate length
  if (trimmed.length < MIN_LENGTHS.MINECRAFT_NAME || trimmed.length > MAX_LENGTHS.MINECRAFT_NAME) {
    return null;
  }
  
  return trimmed;
}

/**
 * Validate application notes
 */
export function validateApplicationNotes(notes: unknown): string | null {
  if (notes === null || notes === undefined) return null;
  if (typeof notes !== "string") return null;
  const trimmed = notes.trim();
  if (trimmed.length > MAX_LENGTHS.DESCRIPTION) return null;
  return trimmed || null;
}

/**
 * Build search query for applications
 */
export function buildApplicationSearchQuery(
  status: AppStatus | undefined, 
  searchTerm: string
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  
  if (status) {
    where["status"] = status;
  }
  
  if (searchTerm) {
    where["OR"] = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { mcUsername: { contains: searchTerm, mode: "insensitive" } },
      { discordUser: { contains: searchTerm, mode: "insensitive" } },
    ];
  }
  
  return where;
}

