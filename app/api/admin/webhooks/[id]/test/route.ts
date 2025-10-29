/**
 * Webhook Test API
 * 
 * POST /api/admin/webhooks/[id]/test
 * Send a test payload to the webhook endpoint
 * 
 * Security: Permission-based access, rate limited
 * Performance: Leverages existing testWebhook utility
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import { testWebhook } from '@/lib/webhooks';
import type { WebhookTestResponse } from '../../schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/webhooks/[id]/test
 * 
 * Send a test request to the webhook endpoint
 * 
 * Purpose:
 * - Verify webhook endpoint is reachable
 * - Test endpoint response time
 * - Validate webhook configuration
 * - Debug delivery issues
 * 
 * Test Payload:
 * - Sends test event with sample data
 * - Includes proper HMAC signature
 * - Returns response status and timing
 * 
 * Security:
 * - Requires webhooks:write permission
 * - Rate limited to 20 tests per hour
 * - Does not affect webhook statistics
 * 
 * Performance:
 * - Respects webhook timeout settings
 * - Returns detailed response metrics
 */
export const POST = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'webhooks:test',
      limit: 20, // Reasonable limit for testing
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
        log.warn('Webhook test permission denied', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission webhooks:write' },
          { status: 403 }
        );
      }

      // Fetch webhook
      const webhook = await prisma.webhook.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          url: true,
          secret: true,
          active: true,
          timeout: true,
        },
      });

      if (!webhook) {
        log.warn('Webhook not found for testing', { userId, webhookId: id });
        return NextResponse.json(
          { success: false, error: 'Webhook not found' },
          { status: 404 }
        );
      }

      log.info('Testing webhook', {
        userId,
        webhookId: id,
        url: webhook.url,
      });

      // Test the webhook using utility function
      const testResult = await testWebhook(webhook.url, webhook.secret);

      const duration = Date.now() - startTime;

      // Log test result
      if (testResult.success) {
        log.info('Webhook test successful', {
          userId,
          webhookId: id,
          duration,
          responseTime: testResult.responseTime,
          statusCode: testResult.statusCode,
        });
      } else {
        log.warn('Webhook test failed', {
          userId,
          webhookId: id,
          duration,
          error: testResult.error,
          statusCode: testResult.statusCode,
        });
      }

      const response: WebhookTestResponse = {
        success: testResult.success,
        statusCode: testResult.statusCode,
        responseTime: testResult.responseTime,
        error: testResult.error,
        message: testResult.success
          ? 'Webhook test successful'
          : `Webhook test failed: ${testResult.error}`,
      };

      return NextResponse.json(
        {
          success: true,
          test: response,
        },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Failed to test webhook', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to test webhook',
        },
        { status: 500 }
      );
    }
  }
);
