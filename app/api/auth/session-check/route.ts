/**
 * Session Check API
 * 
 * GET /api/auth/session-check
 * Lightweight session validation endpoint for middleware
 * 
 * Security: Rate limited, fails closed, no sensitive data exposure
 * Performance: Fast validation for middleware
 * 
 * CRITICAL: Do not remove - middleware depends on this endpoint!
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { getServerSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/session-check
 * 
 * Validates session for middleware
 * 
 * Security:
 * - Rate limited to 60 requests per minute per IP (lenient for middleware)
 * - Fails closed (returns 401 on any error)
 * - No sensitive information in response
 * - Truncated userId for security
 * 
 * Performance:
 * - Single session lookup
 * - Fast validation
 * - No-cache headers
 * 
 * Returns:
 * - 200: Session is valid
 * - 401: Session is invalid or missing
 * - 429: Rate limit exceeded
 * 
 * CRITICAL: Middleware depends on this endpoint!
 */
export const GET = createApiHandler(
  {
    auth: 'none', // Validates auth manually
    rateLimit: {
      key: 'auth:session-check',
      limit: 60, // Lenient for legitimate middleware calls
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async () => {
    const startTime = Date.now();

    try {
      // Validate session
      const session = await getServerSession();

      const duration = Date.now() - startTime;

      // Security: Fail closed - any missing data means invalid
      if (!session?.user?.id) {
        log.debug('Session check failed: No valid session', { duration });

        return NextResponse.json(
          { valid: false },
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'X-Content-Type-Options': 'nosniff',
              'Cache-Control': 'no-store, private',
              'X-Response-Time': `${duration}ms`,
            },
          }
        );
      }

      // Performance: Log slow checks
      if (duration > 100) {
        log.warn('Slow session check', {
          userId: session.user.id,
          duration,
        });
      }

      log.debug('Session check successful', {
        userId: session.user.id,
        duration,
      });

      // Session is valid
      return NextResponse.json(
        {
          valid: true,
          // Include minimal data for debugging (no sensitive info)
          userId: `${session.user.id.substring(0, 8)}...`, // Truncated for security
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store, private',
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      // Security: Fail closed - any error means invalid session
      log.error('Session check error', {
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        { valid: false },
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store, private',
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    }
  }
);
