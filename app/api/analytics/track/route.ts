/**
 * Analytics Tracking API
 * 
 * POST /api/analytics/track
 * Tracks analytics events (page views, actions, etc.)
 * 
 * Security: Public endpoint with optional authentication, rate limited
 * Performance: Async tracking, non-blocking
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { trackEvent, trackPageView } from '@/lib/analytics';
import { getServerSession } from '@/lib/session';
import {
  trackEventSchema,
  type TrackEvent,
} from '../schemas';

export const dynamic = 'force-dynamic';

/**
 * Helper: Track page view event
 */
async function handlePageView(
  data: TrackEvent,
  referrer: string | null,
  session: Awaited<ReturnType<typeof getServerSession>>
) {
  await trackPageView({
    path: data.path || '/',
    ...(session?.user?.id && { userId: session.user.id }),
    ...(session?.session?.id && { sessionId: session.session.id }),
    ...(referrer && { referrer }),
    ...(data.deviceType && { deviceType: data.deviceType }),
    ...(data.browser && { browser: data.browser }),
    ...(data.os && { os: data.os }),
    ...(data.duration !== undefined && { duration: data.duration }),
  });

  log.debug('Page view tracked', {
    path: data.path,
    userId: session?.user?.id,
    deviceType: data.deviceType,
  });
}

/**
 * Helper: Track custom event
 */
async function handleCustomEvent(
  data: TrackEvent,
  referrer: string | null,
  session: Awaited<ReturnType<typeof getServerSession>>
) {
  await trackEvent({
    eventType: data.type,
    eventName: data.eventName || data.type,
    ...(session?.user?.id && { userId: session.user.id }),
    ...(session?.session?.id && { sessionId: session.session.id }),
    ...(data.path && { path: data.path }),
    ...(referrer && { referrer }),
    ...(data.deviceType && { deviceType: data.deviceType }),
    ...(data.browser && { browser: data.browser }),
    ...(data.os && { os: data.os }),
    ...(data.properties && { properties: data.properties }),
    ...(data.duration !== undefined && { duration: data.duration }),
  });

  log.debug('Event tracked', {
    eventType: data.type,
    eventName: data.eventName,
    userId: session?.user?.id,
  });
}

/**
 * POST /api/analytics/track
 * 
 * Tracks analytics events
 * 
 * Request Body:
 * - type: Event type (required)
 * - path: Page path (optional)
 * - eventName: Event name (optional)
 * - deviceType, browser, os: Device info (optional)
 * - duration: Duration in ms (optional)
 * - properties: Additional event properties (optional)
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Rate limited to 120 requests per minute per IP
 * - Input validation with Zod
 * 
 * Performance:
 * - Async fire-and-forget tracking
 * - Non-blocking response
 * - Duration monitoring
 */
export const POST = createApiHandler(
  {
    auth: 'none', // Public endpoint, but can track authenticated users
    rateLimit: {
      key: 'analytics:track',
      limit: 120, // Generous limit for tracking
      window: 60,
      strategy: 'sliding-window',
    },
    validateBody: trackEventSchema,
  },
  async (req, { validatedBody }) => {
    const startTime = Date.now();
    const data = validatedBody as TrackEvent;

    try {
      // Get session if available (optional for tracking)
      const session = await getServerSession();
      const referrer = req.headers.get('referer');

      // Track based on event type
      if (data.type === 'page_view') {
        await handlePageView(data, referrer, session);
      } else {
        await handleCustomEvent(data, referrer, session);
      }

      const duration = Date.now() - startTime;

      // Performance: Log slow tracking
      if (duration > 500) {
        log.warn('Slow analytics tracking', {
          eventType: data.type,
          duration,
        });
      }

      return NextResponse.json(
        { success: true },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error but don't fail the request (fire-and-forget)
      log.error('Failed to track analytics event', {
        eventType: data.type,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Return success anyway to not block client
      // Analytics tracking failures should not impact user experience
      return NextResponse.json(
        {
          success: true,
          warning: 'Event tracking may have failed',
        },
        { status: 200 }
      );
    }
  }
);
