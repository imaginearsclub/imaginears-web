/**
 * Bootstrap Admin API (Development Only)
 * 
 * POST /api/dev/bootstrap-admin
 * Creates system roles and sets up first admin user
 * 
 * Security: ONLY works in development (404 in production)
 * Performance: Database upserts for idempotency
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers as nextHeaders } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { upsertSystemRoles } from '@/lib/migrations/roles';

export const runtime = 'nodejs';


/**
 * Helper: Initialize system roles
 */
async function initializeSystemRoles() {
  await upsertSystemRoles(prisma);
}

/**
 * POST /api/dev/bootstrap-admin
 * 
 * Bootstrap admin user in development
 * 
 * Security:
 * - ONLY works in development (returns 404 in production)
 * - Requires authenticated session
 * - No rate limiting (development only)
 * 
 * Performance:
 * - Upserts for idempotency
 * - Can be called multiple times safely
 * 
 * What it does:
 * 1. Sets user role to OWNER
 * 2. Initializes system roles (OWNER, ADMIN, MODERATOR, STAFF, USER)
 */
export const POST = createApiHandler(
  {
    auth: 'none', // Custom auth check
    // No rate limiting (development only)
  },
  async () => {
    const startTime = Date.now();

    // Security: STRICT development-only enforcement
    if (process.env.NODE_ENV === 'production') {
      log.error('Bootstrap admin attempted in production environment');
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    try {
      // Get session
      const h = await nextHeaders();
      const hdrs = new Headers(h as unknown as Headers);
      const session = await auth.api.getSession({ headers: hdrs });

      if (!session?.user) {
        log.warn('Bootstrap admin attempted without authentication');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userId = session.user.id;

      log.info('Starting admin bootstrap', { userId });

      // Step 1: Set user role to OWNER
      await prisma.user.update({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { role: 'OWNER' } as any,
      });
      log.info('User role set to OWNER', { userId });

      // Step 2: Initialize system roles
      await initializeSystemRoles();

      const duration = Date.now() - startTime;

      log.info('Admin bootstrap completed successfully', {
        userId,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          userId,
          role: 'OWNER',
        },
        {
          headers: { 'X-Response-Time': `${duration}ms` },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to bootstrap admin', {
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to bootstrap admin',
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }
);
