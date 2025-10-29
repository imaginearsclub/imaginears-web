/**
 * Individual Webhook API
 * 
 * GET /api/admin/webhooks/[id] - Get a specific webhook
 * PATCH /api/admin/webhooks/[id] - Update a webhook
 * DELETE /api/admin/webhooks/[id] - Delete a webhook
 * 
 * Security: Permission-based access, rate limited, input validated
 * Performance: Efficient queries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import {
  webhookUpdateSchema,
  type WebhookUpdate,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/webhooks/[id]
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:get',
      limit: 120,
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:read'))) {
        log.warn('Webhook get permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:read' },
          { status: 403 }
        );
      }

      // Fetch webhook
      const webhook = await prisma.webhook.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
      });

      if (!webhook) {
        log.warn('Webhook not found', { userId, webhookId: id });
        return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
      }

      const duration = Date.now() - startTime;

      log.info('Webhook retrieved successfully', { userId, webhookId: id, duration });

      return NextResponse.json(
        {
          success: true,
          webhook: {
            ...webhook,
            secret: '***REDACTED***',
            deliveryCount: webhook._count.deliveries,
            events: webhook.events as string[],
          },
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            'Cache-Control': 'private, max-age=30',
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error('Failed to get webhook', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json({ success: false, error: 'Failed to fetch webhook' }, { status: 500 });
    }
  }
);

/**
 * PATCH /api/admin/webhooks/[id]
 */
export const PATCH = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:update',
      limit: 30,
      window: 3600,
      strategy: 'sliding-window',
    },
    validateBody: webhookUpdateSchema,
  },
  async (_req, { userId, validatedBody, params }) => {
    const startTime = Date.now();
    const data = validatedBody as WebhookUpdate;

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:write'))) {
        log.warn('Webhook update permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:write' },
          { status: 403 }
        );
      }

      log.info('Updating webhook', {
        userId,
        webhookId: id,
        updates: Object.keys(data),
      });

      // Build update data (only include provided fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.url !== undefined) updateData.url = data.url;
      if (data.events !== undefined) updateData.events = data.events;
      if (data.active !== undefined) updateData.active = data.active;
      if (data.retryEnabled !== undefined) updateData.retryEnabled = data.retryEnabled;
      if (data.maxRetries !== undefined) updateData.maxRetries = data.maxRetries;
      if (data.timeout !== undefined) updateData.timeout = data.timeout;
      if (data.rateLimit !== undefined) updateData.rateLimit = data.rateLimit;
      if (data.rateLimitWindow !== undefined) updateData.rateLimitWindow = data.rateLimitWindow;
      if (data.ipWhitelist !== undefined) updateData.ipWhitelist = data.ipWhitelist;
      if (data.autoDisableThreshold !== undefined) {
        updateData.autoDisableThreshold = data.autoDisableThreshold;
      }
      if (data.headers !== undefined) updateData.headers = data.headers;
      if (data.integrationType !== undefined) updateData.integrationType = data.integrationType;
      if (data.integrationConfig !== undefined) {
        updateData.integrationConfig = data.integrationConfig;
      }

      // Update webhook
      const webhook = await prisma.webhook.update({
        where: { id },
        data: updateData,
      });

      const duration = Date.now() - startTime;

      log.info('Webhook updated successfully', { userId, webhookId: id, duration });

      return NextResponse.json(
        {
          success: true,
          webhook: {
            ...webhook,
            secret: '***REDACTED***',
            events: webhook.events as string[],
          },
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check for Prisma error codes
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2025') {
          log.warn('Webhook not found for update', { userId, error });
          return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
        }
      }

      log.error('Failed to update webhook', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json({ success: false, error: 'Failed to update webhook' }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/admin/webhooks/[id]
 */
export const DELETE = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:delete',
      limit: 10,
      window: 3600,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:delete'))) {
        log.warn('Webhook delete permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:delete' },
          { status: 403 }
        );
      }

      log.info('Deleting webhook', { userId, webhookId: id });

      // Delete webhook
      const webhook = await prisma.webhook.delete({
        where: { id },
      });

      const duration = Date.now() - startTime;

      log.info('Webhook deleted successfully', { userId, webhookId: id, duration });

      return NextResponse.json(
        {
          success: true,
          message: 'Webhook deleted successfully',
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check for Prisma error codes
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2025') {
          log.warn('Webhook not found for deletion', { userId, error });
          return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
        }
      }

      log.error('Failed to delete webhook', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json({ success: false, error: 'Failed to delete webhook' }, { status: 500 });
    }
  }
);
