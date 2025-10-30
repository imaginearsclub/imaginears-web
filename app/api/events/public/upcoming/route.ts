/**
 * Upcoming Events API
 * 
 * GET /api/events/public/upcoming - Get upcoming event occurrences (with recurrence expansion)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventStatus } from '@prisma/client';
import { expandEventOccurrences } from '@/lib/recurrence';
import { addDays } from 'date-fns';
import { createApiHandler } from '@/lib/api-middleware';
import { UpcomingEventsQuerySchema, type UpcomingEventsQuery } from '../../schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 300; // ISR: Revalidate every 5 minutes

const MAX_DB_EVENTS = 500; // Limit database query size

/**
 * GET /api/events/public/upcoming
 * 
 * Returns upcoming event occurrences within a date range
 * Handles recurring events by expanding them into individual occurrences
 * 
 * Security: Public endpoint (no auth required)
 * Performance: 
 * - Cached (5min ISR with stale-while-revalidate)
 * - Limited database queries (max 500 events)
 * - Optimized queries with indexed fields
 * - Selective field fetching
 * 
 * Query params:
 * - days: Look-ahead window in days (default: 14, min: 1, max: 90)
 * - limit: Max occurrences to return (default: 200, max: 500)
 * 
 * Use cases:
 * - Event calendar/schedule display
 * - "What's coming up?" widgets
 * - Event planning tools
 */
export const GET = createApiHandler(
  {
    auth: 'none',
    validateQuery: UpcomingEventsQuerySchema,
  },
  async (_req, { validatedQuery }) => {
    const query = validatedQuery as UpcomingEventsQuery;

    // Performance: Calculate date range once
    const now = new Date();
    const until = addDays(now, query.days);

    // Performance: Optimized query with indexed fields and selective fetching
    // Only fetch events that could have occurrences in our date range
    const events = await prisma.event.findMany({
      where: {
        status: EventStatus.Published,
        // Performance: Only get events that end after now (potential upcoming occurrences)
        endAt: { gte: now },
      },
      orderBy: { startAt: 'asc' },
      take: MAX_DB_EVENTS, // Security: Limit database query size
      // Performance: Select fields needed for expansion (full Event type for recurrence lib)
      select: {
        id: true,
        title: true,
        world: true,
        category: true,
        status: true,
        startAt: true,
        endAt: true,
        timezone: true,
        shortDescription: true,
        details: true,
        recurrenceFreq: true,
        byWeekdayJson: true,
        timesJson: true,
        recurrenceUntil: true,
        visibility: true,
        createdById: true,
        updatedById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Performance: Early return if no events
    if (events.length === 0) {
      return NextResponse.json(
        { items: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      );
    }

    // Expand recurring events into individual occurrences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let occurrences = events.flatMap((ev) => expandEventOccurrences(ev as any, now, until));

    // Sort by start time and apply limit
    occurrences = occurrences
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, query.limit);

    return NextResponse.json(
      {
        items: occurrences,
        // Include metadata for client
        meta: {
          count: occurrences.length,
          days: query.days,
          limit: query.limit,
          from: now.toISOString(),
          until: until.toISOString(),
        },
      },
      {
        headers: {
          // Performance: Cache for 5 minutes with stale-while-revalidate
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }
); 
