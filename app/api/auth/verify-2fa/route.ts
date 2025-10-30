/**
 * Verify 2FA API
 * 
 * POST /api/auth/verify-2fa
 * Verifies 2FA code and creates session if valid
 * 
 * Security: Strict rate limiting, audit logging
 * Performance: Efficient verification, parallel operations where possible
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { verifyTOTPToken, verifyBackupCode, decryptSecret } from '@/lib/two-factor';
import { verify2FASchema, type Verify2FARequest } from '../schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Helper: Verify user credentials
 */
async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });

  if (!user) {
    return { valid: false, user: null };
  }

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
    select: { password: true },
  });

  if (!account?.password) {
    return { valid: false, user: null };
  }

  const bcrypt = require('bcryptjs');
  const isValidPassword = await bcrypt.compare(password, account.password);

  return { valid: isValidPassword, user: isValidPassword ? user : null };
}

/**
 * Helper: Verify 2FA code (TOTP or backup code)
 */
function verify2FACode(
  twoFactorSecret: string,
  backupCodes: unknown,
  code: string
) {
  let isValidCode = false;
  let shouldUpdateBackupCodes = false;
  let remainingBackupCodes: string[] | undefined;

  // Try TOTP first
  const decryptedSecret = decryptSecret(twoFactorSecret);
  isValidCode = verifyTOTPToken(code, decryptedSecret);

  // If TOTP fails, try backup codes
  if (!isValidCode && backupCodes) {
    const backupResult = verifyBackupCode(code, backupCodes as string[]);
    if (backupResult.valid) {
      isValidCode = true;
      shouldUpdateBackupCodes = true;
      remainingBackupCodes = backupResult.remainingCodes;
    }
  }

  return { isValidCode, shouldUpdateBackupCodes, remainingBackupCodes };
}

/**
 * Helper: Create session via Better-Auth
 */
async function createSession(email: string, password: string, origin: string) {
  const signInResponse = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!signInResponse.ok) {
    throw new Error('Failed to create session');
  }

  return signInResponse.headers.getSetCookie();
}

/**
 * Helper: Mask email for logging
 */
function maskEmail(email: string): string {
  return `${email.substring(0, 3)}***`;
}

/**
 * Helper: Handle 2FA verification logic
 */
async function handle2FAVerification(data: Verify2FARequest, origin: string) {
  // Step 1: Verify credentials
  const { valid, user } = await verifyCredentials(data.email, data.password);

  if (!valid || !user) {
    return { success: false, status: 401, message: 'Invalid credentials' };
  }

  // Step 2: Verify 2FA is enabled
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    log.warn('2FA not enabled for user attempting verification', {
      userId: user.id,
    });
    return { success: false, status: 400, message: '2FA is not enabled for this account' };
  }

  // Step 3: Verify 2FA code
  const { isValidCode, shouldUpdateBackupCodes, remainingBackupCodes } = verify2FACode(
    user.twoFactorSecret,
    user.backupCodes,
    data.code
  );

  if (!isValidCode) {
    log.warn('Invalid 2FA code', { userId: user.id });
    return { success: false, status: 401, message: 'Invalid 2FA code' };
  }

  // Step 4: Update backup codes if one was used
  if (shouldUpdateBackupCodes && remainingBackupCodes) {
    await prisma.user.update({
      where: { id: user.id },
      data: { backupCodes: remainingBackupCodes },
    });

    log.info('Backup code used and removed', {
      userId: user.id,
      remainingCodes: remainingBackupCodes.length,
    });
  }

  // Step 5: Create session via Better-Auth
  const setCookieHeaders = await createSession(data.email, data.password, origin);

  log.info('2FA verification successful', {
    userId: user.id,
    usedBackupCode: shouldUpdateBackupCodes,
  });

  return { success: true, status: 200, message: '2FA verification successful', setCookieHeaders };
}

/**
 * POST /api/auth/verify-2fa
 * 
 * Verifies 2FA code and creates session
 * 
 * Request Body:
 * - email: User's email
 * - password: User's password
 * - code: 2FA code (TOTP or backup code)
 * 
 * Security:
 * - Rate limited to 5 requests per minute per IP (strict anti-brute-force)
 * - Validates credentials before 2FA check
 * - Updates backup codes when used
 * - Audit logging for all attempts
 * 
 * Performance:
 * - Efficient credential verification
 * - Parallel session creation where possible
 * - Duration monitoring
 */
export const POST = createApiHandler(
  {
    auth: 'none', // Public endpoint (creates auth)
    rateLimit: {
      key: 'auth:verify-2fa',
      limit: 5, // Strict limit to prevent brute force
      window: 60,
      strategy: 'sliding-window',
    },
    validateBody: verify2FASchema,
  },
  async (_req, { validatedBody }) => {
    const startTime = Date.now();
    const data = validatedBody as Verify2FARequest;

    try {
      log.info('Verifying 2FA code', { email: maskEmail(data.email) });

      // Get origin for session creation
      const h = await headers();
      const origin = h.get('origin') || process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000';

      // Handle verification
      const result = await handle2FAVerification(data, origin);

      const duration = Date.now() - startTime;

      // Return error responses
      if (!result.success) {
        log.warn('2FA verification failed', {
          email: maskEmail(data.email),
          status: result.status,
          duration,
        });

        return NextResponse.json(
          { success: false, message: result.message },
          {
            status: result.status,
            headers: { 'X-Response-Time': `${duration}ms` },
          }
        );
      }

      // Return success with session cookies
      const response = NextResponse.json(
        { success: true, message: result.message },
        { headers: { 'X-Response-Time': `${duration}ms` } }
      );

      // Add session cookies from Better-Auth
      if (result.setCookieHeaders) {
        for (const cookie of result.setCookieHeaders) {
          response.headers.append('Set-Cookie', cookie);
        }
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to verify 2FA', {
        email: maskEmail(data.email),
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
