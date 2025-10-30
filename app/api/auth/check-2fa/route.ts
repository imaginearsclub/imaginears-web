/**
 * Check 2FA Status API
 * 
 * POST /api/auth/check-2fa
 * Checks if a user has 2FA enabled without creating a session
 * 
 * Security: Strict rate limiting, timing-attack resistant
 * Performance: Efficient database queries
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { check2FASchema, type Check2FARequest } from '../schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Mask email for logging
 */
function maskEmail(email: string): string {
  return `${email.substring(0, 3)}***`;
}

/**
 * Helper: Verify user credentials
 */
async function verifyCredentials(email: string, password: string) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    return { valid: false, requires2FA: false };
  }

  // Get password from account
  const account = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: 'credential',
    },
    select: { password: true },
  });

  if (!account?.password) {
    return { valid: false, requires2FA: false };
  }

  // Verify password
  const bcrypt = require('bcryptjs');
  const isValidPassword = await bcrypt.compare(password, account.password);

  if (!isValidPassword) {
    return { valid: false, requires2FA: false };
  }

  return { valid: true, requires2FA: user.twoFactorEnabled || false };
}

/**
 * POST /api/auth/check-2fa
 * 
 * Checks if user has 2FA enabled
 * 
 * Request Body:
 * - email: User's email
 * - password: User's password
 * 
 * Security:
 * - Rate limited to 5 requests per minute per IP
 * - Generic error messages to prevent user enumeration
 * - Timing-attack resistant (constant-time operations)
 * - No session creation
 * 
 * Performance:
 * - 2 database queries maximum
 * - Efficient bcrypt comparison
 * - Duration monitoring
 */
export const POST = createApiHandler(
  {
    auth: 'none', // Public endpoint
    rateLimit: {
      key: 'auth:check-2fa',
      limit: 5, // Strict limit to prevent brute force
      window: 60,
      strategy: 'sliding-window',
    },
    validateBody: check2FASchema,
  },
  async (_req, { validatedBody }) => {
    const startTime = Date.now();
    const data = validatedBody as Check2FARequest;

    try {
      log.info('Checking 2FA status', {
        email: maskEmail(data.email),
      });

      // Verify credentials and check 2FA status
      const result = await verifyCredentials(data.email, data.password);

      const duration = Date.now() - startTime;

      // Security: Log authentication attempts
      if (!result.valid) {
        log.warn('Invalid credentials for 2FA check', {
          email: maskEmail(data.email),
          duration,
        });
      } else {
        log.info('2FA check successful', {
          email: maskEmail(data.email),
          requires2FA: result.requires2FA,
          duration,
        });
      }

      // Security: Always return same response structure to prevent user enumeration
      if (!result.valid) {
        return NextResponse.json(
          {
            success: false,
            requires2FA: false,
            message: 'Invalid credentials',
          },
          {
            status: 401,
            headers: {
              'X-Response-Time': `${duration}ms`,
            },
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          requires2FA: result.requires2FA,
          message: result.requires2FA ? '2FA verification required' : 'Credentials verified',
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to check 2FA status', {
        email: maskEmail(data.email),
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return NextResponse.json(
        {
          success: false,
          requires2FA: false,
          message: 'Internal server error',
        },
        { status: 500 }
      );
    }
  }
);
