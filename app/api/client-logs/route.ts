/**
 * Client Logs API
 * 
 * POST /api/client-logs
 * Receives client-side logs and forwards to server Winston logger
 * 
 * Security: Rate limited, input validated
 * Performance: Non-blocking, fire-and-forget style
 */

import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { clientLogSchema, type ClientLogPayload, LogLevel } from './schemas';

export const runtime = 'nodejs';

/**
 * Helper: Log to appropriate Winston level
 */
function logToWinston(level: string, message: string, context: Record<string, unknown>) {
  const prefixedMessage = `[Client] ${message}`;

  switch (level) {
    case LogLevel.ERROR:
      log.error(prefixedMessage, context);
      break;
    case LogLevel.WARN:
      log.warn(prefixedMessage, context);
      break;
    case LogLevel.INFO:
      log.info(prefixedMessage, context);
      break;
    case LogLevel.DEBUG:
      log.debug(prefixedMessage, context);
      break;
    default:
      log.info(prefixedMessage, context);
  }
}

/**
 * POST /api/client-logs
 * 
 * Forwards client logs to server Winston logger
 * 
 * Request Body:
 * - level: Log level (info, warn, error, debug)
 * - message: Log message (1-5000 chars)
 * - context: Additional context (optional)
 * - timestamp: Client timestamp (optional)
 * - userAgent: User agent string (optional)
 * - url: Client URL (optional)
 * 
 * Security:
 * - Public endpoint (no auth required)
 * - Rate limited to 60 requests per minute per IP
 * - Input validation with Zod
 * - Message length limits
 * 
 * Performance:
 * - Non-blocking logging
 * - Fire-and-forget style (silent failures)
 * - Minimal processing overhead
 */
export const POST = createApiHandler(
  {
    auth: 'none', // Public endpoint for client logging
    rateLimit: {
      key: 'client-logs',
      limit: 60, // Generous limit for logging
      window: 60,
      strategy: 'sliding-window',
    },
    validateBody: clientLogSchema,
  },
  async (_req, { validatedBody }) => {
    const data = validatedBody as ClientLogPayload;

    try {
      // Build log context
      const logContext: Record<string, unknown> = {
        ...data.context,
        source: 'client',
      };

      // Add optional fields if present
      if (data.timestamp) {
        logContext['clientTimestamp'] = data.timestamp;
      }
      if (data.userAgent) {
        logContext['userAgent'] = data.userAgent;
      }
      if (data.url) {
        logContext['clientUrl'] = data.url;
      }

      // Log to Winston
      logToWinston(data.level, data.message, logContext);

      return NextResponse.json({ success: true });
    } catch (error) {
      // Silent failure for logging endpoint - don't expose errors to client
      // But log the failure server-side
      log.error('Failed to process client log', {
        error: error instanceof Error ? error.message : String(error),
        level: data.level,
      });

      // Return success anyway to not break client app
      return NextResponse.json({ success: true });
    }
  }
);
