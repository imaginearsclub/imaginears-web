/**
 * Public Events API
 * 
 * GET /api/events/public - List public events (requires API key)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiKey } from '@/lib/api-keys';
import { createApiHandler } from '@/lib/api-middleware';
import { log } from '@/lib/logger';
import { sanitizeInput } from '@/lib/input-sanitization';
import type { Prisma } from '@prisma/client';
import { PublicEventsQuerySchema, type PublicEventsQuery } from '../schemas';

export const runtime = 'nodejs';

/**
 * GET /api/events/public
 * 
 * Public endpoint to list events (requires API key)
 * 
 * Security:
 * - Requires API key with 'public:read' or 'events:read' scope
 * - Rate limited based on API key settings (default: 100 req/min)
 * - Only shows PUBLIC visibility events
 * - Only shows Published events by default
 * 
 * Performance:
 * - Cursor-based pagination
 * - Cached (60s with stale-while-revalidate)
 * - Selective field fetching
 * 
 * Query params:
 * - status: Filter by status (default: Published)
 * - category: Filter by category
 * - limit: Max results (default: 50, max: 100)
 * - cursor: Pagination cursor (event ID)
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Custom API key auth below
    validateQuery: PublicEventsQuerySchema,
  },
  async (req: NextRequest, { validatedQuery }) => {
    // Security: Require API key with appropriate scope
    const auth = await requireApiKey(req, 'public:read');

    if (!auth.authorized) {
      log.warn('Public Events API auth failed', { error: auth.error });
      return NextResponse.json(
        { error: auth.error },
        {
          status: auth.status,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    log.info('Public Events API auth successful', {
      apiKeyName: auth.apiKey.name,
      apiKeyId: auth.apiKey.id,
    });

    const query = validatedQuery as PublicEventsQuery;

    // Security: Validate and sanitize cursor (event ID)
    const cursor =
      query.cursor && typeof query.cursor === 'string'
        ? sanitizeInput(query.cursor, 50)
        : undefined;

    // Build where clause with validated inputs
    const where: Prisma.EventWhereInput = {
      // Security: Only show PUBLIC events on public API
      visibility: 'PUBLIC',
      status: query.status || 'Published',
    };

    if (query.category) {
      where.category = query.category;
    }

    // Fetch events
    const events = await prisma.event.findMany({
      where,
      take: query.limit,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        title: true,
        world: true,
        shortDescription: true,
        details: true,
        category: true,
        visibility: true,
        startAt: true,
        endAt: true,
        status: true,
        timezone: true,
        recurrenceFreq: true,
        byWeekdayJson: true,
        timesJson: true,
        recurrenceUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const nextCursor = events.length === query.limit ? events[events.length - 1]?.id : null;

    return NextResponse.json(
      {
        events,
        pagination: {
          nextCursor,
          limit: query.limit,
        },
        meta: {
          count: events.length,
          apiKeyName: auth.apiKey.name,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
);
