/**
 * Validation Schema for Client Logs API
 * 
 * Zod schema for client-side log forwarding
 */

import { z } from 'zod';

/**
 * Valid log levels
 */
export const LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug',
} as const;

export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Schema for client log payload
 */
export const clientLogSchema = z.object({
  level: z.enum([LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.DEBUG]),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message too long'), // Reasonable limit for log messages
  context: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
  timestamp: z
    .string()
    .optional(),
  userAgent: z
    .string()
    .max(1000, 'User agent too long')
    .optional(),
  url: z
    .string()
    .max(2000, 'URL too long')
    .optional(),
});

export type ClientLogPayload = z.infer<typeof clientLogSchema>;

