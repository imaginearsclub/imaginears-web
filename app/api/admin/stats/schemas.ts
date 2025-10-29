/**
 * Validation Schemas for Stats API
 * 
 * Zod schemas for validating statistics query parameters
 */

import { z } from 'zod';

/**
 * Query schema for events stats endpoint
 * Validates the date range parameter
 */
export const eventsStatsQuerySchema = z.object({
  range: z.coerce
    .number()
    .int('Range must be an integer')
    .min(1, 'Range must be at least 1 day')
    .max(90, 'Range cannot exceed 90 days')
    .default(30),
});

export type EventsStatsQuery = z.infer<typeof eventsStatsQuerySchema>;

/**
 * Response types for stats endpoints
 */
export interface EventsStatsData {
  date: string; // MM-DD format
  count: number;
}

export interface ApplicationsStatusData {
  status: string;
  count: number;
}

