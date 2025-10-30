/**
 * Validation Schemas for Auth API
 * 
 * Comprehensive Zod schemas for authentication operations
 */

import { z } from 'zod';

/**
 * Schema for checking 2FA status
 */
export const check2FASchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(1000, 'Password too long'),
});

export type Check2FARequest = z.infer<typeof check2FASchema>;

/**
 * Schema for verifying 2FA code
 */
export const verify2FASchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(1000, 'Password too long'),
  code: z
    .string()
    .min(6, '2FA code must be at least 6 characters')
    .max(10, '2FA code too long')
    .regex(/^[0-9a-zA-Z-]+$/, '2FA code contains invalid characters'),
});

export type Verify2FARequest = z.infer<typeof verify2FASchema>;

/**
 * Response types
 */
export interface Check2FAResponse {
  success: boolean;
  requires2FA: boolean;
  message: string;
}

export interface Verify2FAResponse {
  success: boolean;
  message: string;
}

export interface SessionCheckResponse {
  valid: boolean;
  userId?: string;
  error?: string;
}

