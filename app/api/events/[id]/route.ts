/**
 * Individual Event API
 * 
 * PATCH /api/events/[id] - Update existing event (requires authentication + permissions)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/api-middleware';
import { checkPermission } from '@/lib/role-security';
import { triggerWebhook, WEBHOOK_EVENTS } from '@/lib/webhooks';
import { log } from '@/lib/logger';
import { sanitizeInput, sanitizeDescription } from '@/lib/input-sanitization';
import { auditLog } from '@/lib/audit-logger';
import type { Prisma } from '@prisma/client';
import {
  EventIdSchema,
  UpdateEventSchema,
  type EventIdParam,
  type UpdateEventInput,
} from '../schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/events/[id]
 * 
 * Update an existing event (partial updates supported)
 * 
 * Security:
 * - Requires authentication
 * - Requires 'events:write' permission
 * - Rate limited (30 updates per minute)
 * - Input validation and sanitization
 * - ID validation
 * - Request body size limit (10KB)
 * 
 * Performance:
 * - Only updates provided fields (partial updates)
 * - Optimized database writes
 * - Async webhook trigger (fire-and-forget)
 * 
 * Audit: Logs event updates with changed fields
 */
export const PATCH = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'events:update',
      limit: 30,
      window: 60,
      strategy: 'sliding-window',
    },
    maxBodySize: 10240, // 10KB
    validateBody: UpdateEventSchema,
  },
  async (_req, { userId, params, validatedBody }) => {
    // Extract and validate event ID
    const idResult = EventIdSchema.safeParse(params);
    if (!idResult.success) {
      log.warn('Invalid event ID format', { params, error: idResult.error });
      return NextResponse.json({ error: 'Invalid event ID format' }, { status: 400 });
    }
    const { id } = idResult.data;

    // Permission check
    const hasPermission = await checkPermission(userId, 'events:write');
    if (!hasPermission) {
      log.warn('Event update forbidden - insufficient permissions', {
        userId,
        eventId: id,
        requiredPermission: 'events:write',
      });
      return NextResponse.json(
        { error: 'Insufficient permissions. Required: events:write' },
        { status: 403 }
      );
    }

    const data = validatedBody as UpdateEventInput;

    // Check if event exists
    const existing = await prisma.event.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      log.warn('Event update failed - event not found', { userId, eventId: id });
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build update data (only include provided fields)
    const updateData: Prisma.EventUpdateInput = {};
    const changedFields: string[] = [];

    if (data.title !== undefined) {
      updateData.title = sanitizeInput(data.title, 200);
      changedFields.push('title');
    }

    if (data.world !== undefined) {
      updateData.world = sanitizeInput(data.world, 100);
      changedFields.push('world');
    }

    if (data.shortDescription !== undefined) {
      updateData.shortDescription = data.shortDescription
        ? sanitizeDescription(data.shortDescription, 500) || null
        : null;
      changedFields.push('shortDescription');
    }

    if (data.details !== undefined) {
      updateData.details = data.details ? sanitizeDescription(data.details, 50000) || null : null;
      changedFields.push('details');
    }

    if (data.category !== undefined) {
      updateData.category = data.category;
      changedFields.push('category');
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      changedFields.push('status');
    }

    if (data.startAt !== undefined) {
      updateData.startAt = data.startAt;
      changedFields.push('startAt');
    }

    if (data.endAt !== undefined) {
      updateData.endAt = data.endAt;
      changedFields.push('endAt');
    }

    if (data.timezone !== undefined) {
      updateData.timezone = data.timezone;
      changedFields.push('timezone');
    }

    if (data.recurrenceFreq !== undefined) {
      updateData.recurrenceFreq = data.recurrenceFreq;
      changedFields.push('recurrenceFreq');
    }

    if (data.byWeekday !== undefined) {
      updateData.byWeekdayJson = data.byWeekday;
      changedFields.push('byWeekday');
    }

    if (data.times !== undefined) {
      updateData.timesJson = data.times;
      changedFields.push('times');
    }

    if (data.recurrenceUntil !== undefined) {
      updateData.recurrenceUntil = data.recurrenceUntil;
      changedFields.push('recurrenceUntil');
    }

    // Perform the update
    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        world: true,
        category: true,
        status: true,
        startAt: true,
        endAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await auditLog({
      action: 'event.updated',
      resourceType: 'event',
      resourceId: id,
      userId,
      metadata: {
        title: updated.title,
        changedFields,
        newStatus: updated.status,
      },
    });

    // Check if event was just published
    const wasPublished = updated.status === 'Published' && existing.status !== 'Published';

    if (wasPublished) {
      await auditLog({
        action: 'event.published',
        resourceType: 'event',
        resourceId: id,
        userId,
        metadata: {
          title: updated.title,
        },
      });
    }

    log.info('Event updated successfully', {
      eventId: id,
      userId,
      changedFields,
      wasPublished,
    });

    // Trigger webhook (async, fire-and-forget)
    const webhookEvent = wasPublished ? WEBHOOK_EVENTS.EVENT_PUBLISHED : WEBHOOK_EVENTS.EVENT_UPDATED;

    triggerWebhook(
      webhookEvent,
      {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        status: updated.status,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
      },
      { userId }
    ).catch((err) =>
      log.error('Webhook trigger failed for event update', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        eventId: id,
      })
    );

    return NextResponse.json(
      {
        id: updated.id,
        title: updated.title,
        world: updated.world,
        category: updated.category,
        status: updated.status,
        startAt: updated.startAt.toISOString(),
        endAt: updated.endAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
);
