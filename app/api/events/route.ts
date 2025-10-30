/**
 * Events API
 * 
 * GET /api/events - List events (paginated, filterable)
 * POST /api/events - Create new event (requires authentication + permissions)
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
  ListEventsQuerySchema,
  CreateEventSchema,
  type ListEventsQuery,
  type CreateEventInput,
} from './schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * 
 * List events with pagination and filtering
 * 
 * Security: Public endpoint (no auth required)
 * Performance: Paginated, cached (60s), parallel count+query
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Filter by status (Draft, Published, Archived)
 * - category: Filter by category
 */
export const GET = createApiHandler(
  {
    auth: 'none',
    validateQuery: ListEventsQuerySchema,
  },
  async (_req, { validatedQuery }) => {
    const query = validatedQuery as ListEventsQuery;

    // Build where clause
    const where: Prisma.EventWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    const skip = (query.page - 1) * query.limit;

    // Performance: Run count and query in parallel
    const [total, items] = await Promise.allSettled([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          world: true,
          category: true,
          status: true,
          startAt: true,
          endAt: true,
          timezone: true,
          recurrenceFreq: true,
          byWeekdayJson: true,
          timesJson: true,
          recurrenceUntil: true,
          shortDescription: true,
          details: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalCount = total.status === 'fulfilled' ? total.value : 0;
    const events = items.status === 'fulfilled' ? items.value : [];
    const totalPages = Math.ceil(totalCount / query.limit);

    return NextResponse.json(
      {
        items: events,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: query.page,
          pageSize: query.limit,
          hasNextPage: query.page < totalPages,
          hasPreviousPage: query.page > 1,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
);

/**
 * POST /api/events
 * 
 * Create a new event
 * 
 * Security:
 * - Requires authentication
 * - Requires 'events:write' permission
 * - Rate limited (10 creates per minute)
 * - Input validation and sanitization
 * - Request body size limit (10KB)
 * 
 * Performance:
 * - Optimized database writes
 * - Async webhook trigger (fire-and-forget)
 * 
 * Audit: Logs event creation with user details
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'events:create',
      limit: 10,
      window: 60,
      strategy: 'sliding-window',
    },
    maxBodySize: 10240, // 10KB
    validateBody: CreateEventSchema,
  },
  async (_req, { userId, validatedBody }) => {
    // Ensure userId is defined (auth middleware should guarantee this)
    if (!userId) {
      log.error('Missing userId in authenticated request');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Permission check
    const hasPermission = await checkPermission(userId, 'events:write');
    if (!hasPermission) {
      log.warn('Event creation forbidden - insufficient permissions', {
        userId,
        requiredPermission: 'events:write',
      });
      return NextResponse.json(
        { error: 'Insufficient permissions. Required: events:write' },
        { status: 403 }
      );
    }

    const data = validatedBody as CreateEventInput;

    // Additional sanitization for text fields (defense in depth)
    const sanitizedData = {
      title: sanitizeInput(data.title, 200),
      world: sanitizeInput(data.world, 100),
      shortDescription: data.shortDescription
        ? sanitizeDescription(data.shortDescription, 500) || null
        : null,
      details: data.details ? sanitizeDescription(data.details, 50000) || null : null,
      category: data.category,
      status: data.status,
      startAt: data.startAt,
      endAt: data.endAt,
      timezone: data.timezone,
      recurrenceFreq: data.recurrenceFreq,
      ...(data.byWeekday && { byWeekdayJson: data.byWeekday }),
      ...(data.times && { timesJson: data.times }),
      recurrenceUntil: data.recurrenceUntil || null,
    };

    // Create event
    const created = await prisma.event.create({
      data: sanitizedData,
      select: {
        id: true,
        title: true,
        world: true,
        category: true,
        status: true,
        startAt: true,
        endAt: true,
        createdAt: true,
      },
    });

    // Audit log
    await auditLog({
      action: 'event.created',
      resourceType: 'event',
      resourceId: created.id,
      userId,
      details: {
        title: created.title,
        category: sanitizedData.category,
        status: sanitizedData.status,
        world: created.world,
      },
    });

    log.info('Event created successfully', {
      eventId: created.id,
      userId,
      title: created.title,
      category: sanitizedData.category,
    });

    // Trigger webhook (async, fire-and-forget)
    triggerWebhook(
      WEBHOOK_EVENTS.EVENT_CREATED,
      {
        id: created.id,
        title: created.title,
        category: sanitizedData.category,
        status: sanitizedData.status,
        startAt: created.startAt.toISOString(),
        endAt: created.endAt.toISOString(),
      },
      userId ? { userId } : undefined
    ).catch((err) =>
      log.error('Webhook trigger failed for event creation', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        eventId: created.id,
      })
    );

    return NextResponse.json(
      {
        id: created.id,
        title: created.title,
        world: created.world,
        startAt: created.startAt,
        endAt: created.endAt,
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
);
