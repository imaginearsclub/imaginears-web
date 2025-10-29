/**
 * Webhooks Management API
 * 
 * GET /api/admin/webhooks - List all webhooks with filtering
 * POST /api/admin/webhooks - Create a new webhook
 * 
 * Security: Permission-based access, rate limited, input validated
 * Performance: Parallel queries, efficient pagination
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import crypto from 'crypto';
import {
  webhooksListQuerySchema,
  webhookCreateSchema,
  type WebhooksListQuery,
  type WebhookCreate,
  type WebhooksListResponse,
} from './schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Redact webhook secret
 */
function redactSecret<T extends { secret: string | null }>(webhook: T): T {
  return {
    ...webhook,
    secret: '***REDACTED***',
  };
}

/**
 * GET /api/admin/webhooks
 * 
 * List all webhooks with optional filtering
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:list',
      limit: 120,
      window: 60,
      strategy: 'sliding-window',
    },
    validateQuery: webhooksListQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const startTime = Date.now();
    const query = validatedQuery as WebhooksListQuery;

    try {
      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:read'))) {
        log.warn('Webhooks list permission denied', { userId });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:read' },
          { status: 403 }
        );
      }

      log.info('Listing webhooks', {
        userId,
        filters: {
          active: query.active,
          integrationType: query.integrationType,
          limit: query.limit,
          offset: query.offset,
        },
      });

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      if (query.active !== undefined) {
        where.active = query.active;
      }
      if (query.integrationType) {
        where.integrationType = query.integrationType;
      }

      // Fetch webhooks and total count in parallel
      const [webhooks, totalCount] = await Promise.all([
        prisma.webhook.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: query.limit,
          skip: query.offset,
          include: {
            _count: {
              select: {
                deliveries: true,
              },
            },
          },
        }),
        prisma.webhook.count({ where }),
      ]);

      // Transform webhooks with redacted secrets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transformedWebhooks = webhooks.map((webhook): any => ({
        ...redactSecret(webhook),
        deliveryCount: webhook._count.deliveries,
        events: webhook.events as string[],
        ipWhitelist: webhook.ipWhitelist as string[] | null,
        headers: webhook.headers as Record<string, string> | null,
        integrationConfig: webhook.integrationConfig as Record<string, unknown> | null,
      }));

      const duration = Date.now() - startTime;

      if (duration > 1000) {
        log.warn('Slow webhooks list query', { userId, duration, totalCount, filters: query });
      }

      log.info('Webhooks listed successfully', {
        userId,
        duration,
        count: webhooks.length,
        totalCount,
      });

      const response: WebhooksListResponse = {
        webhooks: transformedWebhooks,
        totalCount,
        hasMore: query.offset + query.limit < totalCount,
      };

      return NextResponse.json(
        { success: true, ...response },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            'Cache-Control': 'private, max-age=30',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('Failed to list webhooks', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json({ success: false, error: 'Failed to fetch webhooks' }, { status: 500 });
    }
  }
);

/**
 * POST /api/admin/webhooks
 * 
 * Create a new webhook
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:create',
      limit: 20,
      window: 3600,
      strategy: 'sliding-window',
    },
    validateBody: webhookCreateSchema,
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();
    const data = validatedBody as WebhookCreate;

    try {
      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:write'))) {
        log.warn('Webhook creation permission denied', { userId });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:write' },
          { status: 403 }
        );
      }

      log.info('Creating webhook', {
        userId,
        name: data.name,
        url: data.url,
        events: data.events,
      });

      // Generate secure secret if not provided
      const secret = data.secret || crypto.randomBytes(32).toString('hex');

      // Create webhook
      const webhook = await prisma.webhook.create({
        data: {
          name: data.name,
          description: data.description || null,
          url: data.url,
          events: data.events,
          secret,
          ...(data.ipWhitelist && { ipWhitelist: data.ipWhitelist as unknown as Prisma.InputJsonValue }),
          ...(data.headers && { headers: data.headers as unknown as Prisma.InputJsonValue }),
          active: data.active,
          retryEnabled: data.retryEnabled,
          maxRetries: data.maxRetries,
          timeout: data.timeout,
          rateLimit: data.rateLimit,
          rateLimitWindow: data.rateLimitWindow,
          autoDisableThreshold: data.autoDisableThreshold,
          integrationType: data.integrationType || null,
          ...(data.integrationConfig && { integrationConfig: data.integrationConfig as unknown as Prisma.InputJsonValue }),
          createdById: userId!,
        },
      });

      const duration = Date.now() - startTime;

      log.info('Webhook created successfully', {
        userId,
        webhookId: webhook.id,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          webhook: {
            ...webhook,
            deliveryCount: 0,
            events: webhook.events as string[],
          },
          message: 'Webhook created successfully. Save the secret securely - it will not be shown again.',
        },
        {
          status: 201,
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('Failed to create webhook', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json({ success: false, error: 'Failed to create webhook' }, { status: 500 });
    }
  }
);
