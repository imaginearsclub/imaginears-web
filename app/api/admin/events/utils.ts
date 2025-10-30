/**
 * Shared utilities for admin event validation and queries
 * 
 * Implements DRY principles for admin event CRUD operations
 */

import type { Prisma, EventCategory, EventVisibility } from "@prisma/client";
import { sanitizeInput, sanitizeDescription } from "@/lib/input-sanitization";

/**
 * Event validation constants
 */
export const EVENT_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_WORLD_LENGTH: 100,
  MAX_SHORT_DESC_LENGTH: 500,
  MAX_DETAILS_LENGTH: 50000,
  VALID_CATEGORIES: ["Fireworks", "SeasonalOverlay", "Seasonal", "MeetAndGreet", "Parade", "Other"] as const,
  VALID_STATUSES: ["Draft", "Published", "Archived"] as const,
} as const;

/**
 * Event validation result type
 */
export type EventValidationResult = { 
  data: Record<string, unknown>; 
  error?: string 
};

/**
 * Validate enum value
 */
export function validateEnum(value: unknown, validValues: readonly string[]): boolean {
  return typeof value === 'string' && validValues.includes(value);
}

/**
 * Validate string length
 */
export function validateStringLength(value: unknown, min: number, max: number): string | null {
  if (!value || typeof value !== 'string') return null;
  const str = sanitizeInput(String(value), max);
  if (str.length < min || str.length > max) {
    return null;
  }
  return str;
}

/**
 * Validate date field
 */
export function validateDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  try {
    const date = new Date(value as string);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Build where clause from validated query parameters
 */
export function buildEventWhereClause(query: {
  status?: string | undefined;
  category?: string | undefined;
  visibility?: string | undefined;
}): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};
  
  if (query.status) {
    where.status = query.status as typeof EVENT_CONSTANTS.VALID_STATUSES[number];
  }
  if (query.category) {
    where.category = query.category as EventCategory;
  }
  if (query.visibility) {
    where.visibility = query.visibility as EventVisibility;
  }
  
  return where;
}

/**
 * Validate event update fields
 */
// eslint-disable-next-line complexity
export function validateEventUpdate(body: Record<string, unknown>): EventValidationResult {
  const data: Record<string, unknown> = {};
  
  if (body['title'] !== undefined) {
    const title = validateStringLength(body['title'], 1, EVENT_CONSTANTS.MAX_TITLE_LENGTH);
    if (!title) return { data, error: "Title must be 1-200 characters" };
    data["title"] = title;
  }
  
  if (body['shortDescription'] !== undefined) {
    const shortDesc = typeof body['shortDescription'] === 'string' 
      ? sanitizeDescription(body['shortDescription'], EVENT_CONSTANTS.MAX_SHORT_DESC_LENGTH)
      : null;
    data['shortDescription'] = shortDesc;
  }
  
  if (body['details'] !== undefined) {
    const details = typeof body['details'] === 'string'
      ? sanitizeDescription(body['details'], EVENT_CONSTANTS.MAX_DETAILS_LENGTH)
      : null;
    data['details'] = details;
  }
  
  if (body['category'] !== undefined) {
    if (!validateEnum(body['category'], EVENT_CONSTANTS.VALID_CATEGORIES)) {
      return { data, error: "Invalid category" };
    }
    data["category"] = body['category'];
  }
  
  if (body['status'] !== undefined) {
    if (!validateEnum(body['status'], EVENT_CONSTANTS.VALID_STATUSES)) {
      return { data, error: "Invalid status" };
    }
    data["status"] = body['status'];
  }
  
  if (body['world'] !== undefined) {
    const world = validateStringLength(body['world'], 1, EVENT_CONSTANTS.MAX_WORLD_LENGTH);
    if (!world) return { data, error: "World must be 1-100 characters" };
    data["world"] = world;
  }
  
  if (body['startAt'] !== undefined) {
    const date = validateDate(body['startAt']);
    if (!date) return { data, error: "Invalid startAt date" };
    data["startAt"] = date;
  }
  
  if (body['endAt'] !== undefined) {
    if (body['endAt'] === null) {
      data["endAt"] = null;
    } else {
      const date = validateDate(body['endAt']);
      if (!date) return { data, error: "Invalid endAt date" };
      data["endAt"] = date;
    }
  }
  
  // Validation: If both dates provided, end must be after start
  if (data["startAt"] && data["endAt"] && data["endAt"] <= data["startAt"]) {
    return { data, error: "End date must be after start date" };
  }
  
  return { data };
}

