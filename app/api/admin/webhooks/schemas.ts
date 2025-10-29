/**
 * Validation Schemas for Webhooks API
 * 
 * Comprehensive Zod schemas for validating webhook operations
 */

import { z } from 'zod';

/**
 * Valid webhook event types
 */
export const WebhookEventType = {
  APPLICATION_SUBMITTED: 'application.submitted',
  APPLICATION_APPROVED: 'application.approved',
  APPLICATION_REJECTED: 'application.rejected',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  EVENT_CREATED: 'event.created',
  EVENT_UPDATED: 'event.updated',
  EVENT_CANCELLED: 'event.cancelled',
  SESSION_CREATED: 'session.created',
  SESSION_EXPIRED: 'session.expired',
} as const;

export type WebhookEventTypeValue = (typeof WebhookEventType)[keyof typeof WebhookEventType];

/**
 * Valid webhook delivery statuses
 */
export const WebhookDeliveryStatus = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  RETRYING: 'retrying',
} as const;

export type WebhookDeliveryStatusValue = (typeof WebhookDeliveryStatus)[keyof typeof WebhookDeliveryStatus];

/**
 * Valid integration types
 */
export const IntegrationType = {
  DISCORD: 'discord',
  SLACK: 'slack',
  CUSTOM: 'custom',
} as const;

export type IntegrationTypeValue = (typeof IntegrationType)[keyof typeof IntegrationType];

/**
 * Query schema for listing webhooks
 */
export const webhooksListQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  integrationType: z
    .enum([IntegrationType.DISCORD, IntegrationType.SLACK, IntegrationType.CUSTOM])
    .optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

export type WebhooksListQuery = z.infer<typeof webhooksListQuerySchema>;

/**
 * Schema for creating a webhook
 */
export const webhookCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
  url: z
    .string()
    .url('Invalid URL format')
    .refine(
      (val) => val.startsWith('http://') || val.startsWith('https://'),
      { message: 'URL must start with http:// or https://' }
    ),
  events: z
    .array(z.string())
    .min(1, 'At least one event is required')
    .max(20, 'Cannot subscribe to more than 20 events'),
  secret: z
    .string()
    .min(16, 'Secret must be at least 16 characters')
    .optional(),
  ipWhitelist: z
    .array(z.string().ip({ message: 'Invalid IP address' }))
    .max(50, 'Cannot have more than 50 whitelisted IPs')
    .optional()
    .nullable(),
  headers: z
    .record(z.string())
    .optional()
    .nullable(),
  active: z.boolean().optional().default(true),
  retryEnabled: z.boolean().optional().default(true),
  maxRetries: z
    .number()
    .int('Max retries must be an integer')
    .min(0, 'Max retries cannot be negative')
    .max(10, 'Max retries cannot exceed 10')
    .optional()
    .default(3),
  timeout: z
    .number()
    .int('Timeout must be an integer')
    .min(5, 'Timeout must be at least 5 seconds')
    .max(60, 'Timeout cannot exceed 60 seconds')
    .optional()
    .default(30),
  rateLimit: z
    .number()
    .int('Rate limit must be an integer')
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit cannot exceed 1000')
    .optional()
    .default(60),
  rateLimitWindow: z
    .number()
    .int('Rate limit window must be an integer')
    .min(1, 'Rate limit window must be at least 1 second')
    .max(3600, 'Rate limit window cannot exceed 1 hour')
    .optional()
    .default(60),
  autoDisableThreshold: z
    .number()
    .int('Auto-disable threshold must be an integer')
    .min(0, 'Auto-disable threshold cannot be negative')
    .max(100, 'Auto-disable threshold cannot exceed 100')
    .optional()
    .default(10),
  integrationType: z
    .enum([IntegrationType.DISCORD, IntegrationType.SLACK, IntegrationType.CUSTOM])
    .optional()
    .nullable(),
  integrationConfig: z
    .record(z.unknown())
    .optional()
    .nullable(),
});

export type WebhookCreate = z.infer<typeof webhookCreateSchema>;

/**
 * Schema for updating a webhook
 */
export const webhookUpdateSchema = webhookCreateSchema
  .partial()
  .omit({ secret: true }); // Cannot update secret directly, use rotate-secret endpoint

export type WebhookUpdate = z.infer<typeof webhookUpdateSchema>;

/**
 * Query schema for webhook deliveries
 */
export const webhookDeliveriesQuerySchema = z.object({
  status: z
    .enum([
      WebhookDeliveryStatus.PENDING,
      WebhookDeliveryStatus.SUCCESS,
      WebhookDeliveryStatus.FAILED,
      WebhookDeliveryStatus.RETRYING,
    ])
    .optional(),
  eventType: z.string().optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset cannot be negative')
    .default(0),
});

export type WebhookDeliveriesQuery = z.infer<typeof webhookDeliveriesQuerySchema>;

/**
 * Response types
 */
export interface WebhookResponse {
  id: string;
  name: string;
  description: string | null;
  url: string;
  events: string[];
  secret: string; // Will be redacted in most responses
  ipWhitelist: string[] | null;
  headers: Record<string, string> | null;
  active: boolean;
  retryEnabled: boolean;
  maxRetries: number;
  timeout: number;
  rateLimit: number;
  rateLimitWindow: number;
  autoDisableThreshold: number;
  integrationType: string | null;
  integrationConfig: Record<string, unknown> | null;
  deliveryCount?: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhooksListResponse {
  webhooks: WebhookResponse[];
  totalCount: number;
  hasMore: boolean;
}

export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  eventType: string;
  status: WebhookDeliveryStatusValue;
  statusCode: number | null;
  responseTime: number | null;
  attempt: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface WebhookDeliveriesResponse {
  deliveries: WebhookDeliveryResponse[];
  totalCount: number;
  statistics: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    retrying: number;
  };
  hasMore: boolean;
}

export interface WebhookHealthResponse {
  webhookId: string;
  isHealthy: boolean;
  successRate: number;
  averageResponseTime: number;
  recentErrors: number;
  lastSuccessfulDelivery: Date | null;
  lastFailedDelivery: Date | null;
  totalDeliveries: number;
  failedDeliveries: number;
}

export interface WebhookTestResponse {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  message: string;
}

