/**
 * Validation Schemas for Sync API
 * 
 * Zod schemas for validating sync-related API requests
 */

import { z } from 'zod';

/**
 * Query schema for sync history endpoint
 */
export const syncHistoryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(200, 'Limit cannot exceed 200')
    .default(50),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0),
});

/**
 * Body schema for sync configuration updates
 */
export const syncConfigUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(['hourly', 'daily', 'weekly'], {
    errorMap: () => ({ message: 'Frequency must be hourly, daily, or weekly' }),
  }).optional(),
  time: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format (24-hour)')
    .optional(),
  dayOfWeek: z.number()
    .int()
    .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
    .nullable()
    .optional(),
  notifyOnFailure: z.boolean().optional(),
  notifyOnSuccess: z.boolean().optional(),
  retryOnFailure: z.boolean().optional(),
  maxRetries: z.number()
    .int()
    .min(0, 'Max retries must be non-negative')
    .max(10, 'Max retries cannot exceed 10')
    .optional(),
}).refine(
  (data) => {
    // If frequency is weekly, dayOfWeek must be provided
    if (data.frequency === 'weekly' && data.dayOfWeek === null) {
      return false;
    }
    return true;
  },
  {
    message: 'Day of week must be specified when frequency is weekly',
    path: ['dayOfWeek'],
  }
);

export type SyncHistoryQuery = z.infer<typeof syncHistoryQuerySchema>;
export type SyncConfigUpdate = z.infer<typeof syncConfigUpdateSchema>;

