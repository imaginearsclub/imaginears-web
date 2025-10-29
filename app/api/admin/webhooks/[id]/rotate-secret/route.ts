/**
 * Webhook Secret Rotation API
 * 
 * POST /api/admin/webhooks/[id]/rotate-secret
 * Rotate (regenerate) the webhook secret for security
 * 
 * Security: Permission-based access, strict rate limiting, audit logging
 * Performance: Efficient single update operation
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/webhooks/[id]/rotate-secret
 * 
 * Rotate (regenerate) the webhook secret
 * 
 * Security Considerations:
 * - Generates cryptographically secure random secret (64 hex characters)
 * - Requires webhooks:write permission
 * - Rate limited to 5 rotations per hour (strict)
 * - New secret returned only once (must be saved immediately)
 * - Audit logged for security compliance
 * 
 * Use Cases:
 * - Suspected secret compromise
 * - Periodic security rotation
 * - Access revocation
 * 
 * Warning: After rotation, webhook deliveries will use the new secret.
 * Update your webhook endpoint to validate the new signature.
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:rotate-secret',
      limit: 5, // Strict limit for security operations
      window: 3600,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId, params }) => {
    const startTime = Date.now();

    try {
      const { id } = await params!;

      // Check permission
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user || !(await userHasPermissionAsync(user.role, 'webhooks:write'))) {
        log.warn('Secret rotation permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:write' },
          { status: 403 }
        );
      }

      log.info('Rotating webhook secret', {
        userId,
        webhookId: id,
      });

      // Generate new cryptographically secure secret
      const newSecret = crypto.randomBytes(32).toString('hex');

      // Update webhook with new secret
      const webhook = await prisma.webhook.update({
        where: { id },
        data: { secret: newSecret },
        select: { id: true, name: true, url: true },
      });

      const duration = Date.now() - startTime;

      log.info('Webhook secret rotated successfully', {
        userId,
        webhookId: id,
        duration,
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Secret rotated successfully. Save the new secret securely - it will not be shown again.',
          secret: newSecret, // Only time the secret is exposed
          webhookId: webhook.id,
          webhookName: webhook.name,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check for Prisma error codes
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2025') {
          log.warn('Webhook not found for secret rotation', { userId, error });
          return NextResponse.json(
            { success: false, error: 'Webhook not found' },
            { status: 404 }
          );
        }
      }

      log.error('Failed to rotate webhook secret', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to rotate webhook secret',
        },
        { status: 500 }
      );
    }
  }
);
