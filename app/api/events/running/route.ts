/**
 * Running Events API
 * 
 * GET /api/events/running - Get currently running (active) events
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiHandler } from '@/lib/api-middleware';
import { RunningEventsQuerySchema, type RunningEventsQuery } from '../schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/events/running
 * 
 * Returns currently running (active) events
 * 
 * An event is considered "running" if:
 * - Status is "Published"
 * - Current time is between startAt and endAt
 * 
 * Security: Public endpoint (no auth required)
 * Performance: Cached (30s), optimized query with indexed fields
 * 
 * Query params:
 * - limit: Number of events to return (default: 3, max: 50)
 * 
 * Use cases:
 * - "What's happening now?" widget
 * - Active events banner
 * - Live event notifications
 */
export const GET = createApiHandler(
  {
    auth: 'none',
    validateQuery: RunningEventsQuerySchema,
  },
  async (_req, { validatedQuery }) => {
    const query = validatedQuery as RunningEventsQuery;

    // Performance: Use current timestamp once
    const now = new Date();

    // Performance: Optimized query with indexed fields (status, startAt, endAt)
    const rows = await prisma.event.findMany({
      where: {
        status: 'Published',
        startAt: { lte: now },
        endAt: { gte: now },
      },
      orderBy: [{ endAt: 'asc' }], // Ending soonest first
      take: query.limit,
      // Performance: Only select needed fields
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
      },
    });

    // Performance: Early return if no events
    if (rows.length === 0) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Serialize dates to ISO for client
    const items = rows.map((e) => ({
      ...e,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      recurrenceUntil: e.recurrenceUntil?.toISOString() ?? null,
    }));

    return NextResponse.json(items, {
      headers: {
        // Performance: Cache for 30 seconds (events are "running" in real-time)
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
);
