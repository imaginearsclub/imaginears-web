/**
 * Shared utilities for API key validation
 * 
 * Implements DRY principles for API key CRUD operations
 */

import { API_SCOPES } from "@/lib/api-keys";

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { valid: true; data: T } 
  | { valid: false; error: string };

/**
 * Validate API key name
 */
export function validateName(name: unknown): string | null {
  if (typeof name !== "string" || name.trim().length === 0) return null;
  return name.trim();
}

/**
 * Validate API key scopes
 */
export function validateScopes(scopes: unknown): string[] | null {
  if (!Array.isArray(scopes) || scopes.length === 0) return null;
  
  const validScopes = Object.keys(API_SCOPES);
  const invalidScopes = scopes.filter((s) => !validScopes.includes(s as string));
  if (invalidScopes.length > 0) return null;
  
  return scopes;
}

/**
 * Validate rate limit value
 */
export function validateRateLimit(value: unknown): number | null {
  const parsed = parseInt(value as string);
  if (isNaN(parsed) || parsed < 1 || parsed > 10000) return null;
  return parsed;
}

/**
 * Validate description field
 */
export function validateDescription(description: unknown): string | null {
  if (description === null || description === undefined) return null;
  if (typeof description !== "string") return null;
  return description.trim() || null;
}

/**
 * Validate expiration date
 */
export function validateExpiresAt(expiresAt: unknown): Date | null {
  if (expiresAt === null || expiresAt === undefined) return null;
  if (typeof expiresAt !== "string") return null;
  const date = new Date(expiresAt);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Validate isActive boolean
 */
export function validateIsActive(isActive: unknown): boolean | null {
  if (typeof isActive !== "boolean") return null;
  return isActive;
}

