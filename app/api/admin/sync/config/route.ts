/**
 * Sync Configuration API
 * 
 * GET /api/admin/sync/config - Retrieve sync configuration
 * PATCH /api/admin/sync/config - Update sync configuration
 * 
 * Security: Requires analytics:read permission, rate limited, audit logged
 * Performance: Optimized database queries, validation before updates
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { createApiHandler } from '@/lib/api-middleware';
import { userHasPermissionAsync } from '@/lib/rbac-server';
import {
  getSyncConfiguration,
  updateSyncConfiguration,
} from '@/lib/sync-scheduler';
import { syncConfigUpdateSchema, type SyncConfigUpdate } from '../schemas';
import { jsonOk, jsonError } from '@/app/api/admin/sessions/response';
import { tryConditionalGet } from '@/lib/http';
import { cache } from '@/lib/cache';

/**
 * Helper: Build typed update payload for sync configuration
 */
function buildSyncUpdatePayload(updates: SyncConfigUpdate): {
  enabled?: boolean;
  frequency?: string;
  time?: string;
  dayOfWeek?: number | null;
  notifyOnFailure?: boolean;
  notifyOnSuccess?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
} {
  const payload: {
    enabled?: boolean;
    frequency?: string;
    time?: string;
    dayOfWeek?: number | null;
    notifyOnFailure?: boolean;
    notifyOnSuccess?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
  } = {};
  if (updates.enabled !== undefined) payload.enabled = updates.enabled;
  if (updates.frequency !== undefined) payload.frequency = updates.frequency;
  if (updates.time !== undefined) payload.time = updates.time;
  if (updates.dayOfWeek !== undefined) payload.dayOfWeek = updates.dayOfWeek;
  if (updates.notifyOnFailure !== undefined) payload.notifyOnFailure = updates.notifyOnFailure;
  if (updates.notifyOnSuccess !== undefined) payload.notifyOnSuccess = updates.notifyOnSuccess;
  if (updates.retryOnFailure !== undefined) payload.retryOnFailure = updates.retryOnFailure;
  if (updates.maxRetries !== undefined) payload.maxRetries = updates.maxRetries;
  return payload;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync/config
 * 
 * Retrieves current sync configuration settings
 * 
 * Security:
 * - Requires authenticated user with analytics:read permission
 * - Rate limited to 60 requests per minute
 * 
 * Performance:
 * - Fast single-record database query
 * - Creates default config if none exists
 */
export const GET = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sync:config:read',
      limit: 60, // Max 60 requests per minute
      window: 60,
      strategy: 'sliding-window',
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // Fetch user's role for RBAC check
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true },
      });

      if (!user) {
        log.warn('Sync config read - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check analytics:read permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'analytics:read'
      );

      if (!hasPermission) {
        log.warn('Sync config read - insufficient permissions', { 
          userId, 
          role: user.role,
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to view sync configuration' },
          { status: 403 }
        );
      }

      // Fetch configuration (creates default if not exists)
      const config = await getSyncConfiguration();

      const duration = Date.now() - startTime;

      log.info('Sync configuration retrieved', {
        userId,
        duration,
        configEnabled: config.enabled,
      });

      const payload = { success: true, data: config } as const;
      const decision = tryConditionalGet(_req, payload);
      if (decision.status === 304) {
        return jsonOk(_req, null, { headers: decision.headers, status: 304 as unknown as number });
      }
      return jsonOk(_req, payload, { headers: { ...decision.headers, 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Sync config read failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to fetch sync configuration', 500);
    }
  }
);

/**
 * PATCH /api/admin/sync/config
 * 
 * Updates sync configuration settings
 * 
 * Security:
 * - Requires authenticated user with analytics:read permission
 * - Rate limited to 20 updates per hour (more restrictive than reads)
 * - Input validation with Zod schema
 * - Audit logged for compliance
 * 
 * Performance:
 * - Validates input before database operation
 * - Efficient upsert operation
 * - Automatic next sync time calculation
 */
export const PATCH = createApiHandler(
  {
    auth: 'user',
    rateLimit: {
      key: 'sync:config:update',
      limit: 20, // Max 20 updates per hour
      window: 3600,
      strategy: 'sliding-window',
    },
    validateBody: syncConfigUpdateSchema,
    maxBodySize: 10_000, // 10KB max
  },
  async (_req, { userId, validatedBody }) => {
    const startTime = Date.now();

    try {
      // Idempotency support
      const idemKey = _req.headers.get('idempotency-key');
      if (idemKey) {
        const prior = await cache.get<{ response: unknown }>(`idemp:sync-config:${idemKey}`);
        if (prior?.response) {
          return jsonOk(_req, prior.response, { headers: { 'X-Response-Time': '0ms', 'X-Idempotent-Replay': '1' } });
        }
      }
      // Fetch user's role and email for RBAC and audit logging
      const user = await prisma.user.findUnique({
        where: { id: userId! },
        select: { role: true, email: true, name: true },
      });

      if (!user) {
        log.warn('Sync config update - user not found', { userId });
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // RBAC: Check analytics:read permission
      // TODO: Consider adding a more specific sync:configure permission
      const hasPermission = await userHasPermissionAsync(
        user.role,
        'analytics:read'
      );

      if (!hasPermission) {
        log.warn('Sync config update - insufficient permissions', { 
          userId, 
          role: user.role,
          email: user.email,
        });
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions to update sync configuration' },
          { status: 403 }
        );
      }

      // Extract validated update data
      const updates = validatedBody as SyncConfigUpdate;

      // Get current config for audit logging
      const previousConfig = await getSyncConfiguration();

      // Update configuration
      const updatedConfig = await updateSyncConfiguration(buildSyncUpdatePayload(updates));

      const duration = Date.now() - startTime;

      // Security: Audit log configuration changes
      log.warn('Sync configuration updated', {
        userId,
        email: user.email,
        name: user.name,
        duration,
        changes: updates,
        previousEnabled: previousConfig.enabled,
        newEnabled: updatedConfig.enabled,
        previousFrequency: previousConfig.frequency,
        newFrequency: updatedConfig.frequency,
      });

      const responseBody = {
        success: true,
        message: 'Sync configuration updated successfully',
        data: updatedConfig,
      };
      if (idemKey) {
        await cache.set(`idemp:sync-config:${idemKey}`, { response: responseBody }, 60);
      }
      return jsonOk(_req, responseBody, { headers: { 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error('Sync config update failed', {
        userId,
        duration,
        updates: validatedBody,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Security: Generic error message
      return jsonError(_req, 'Failed to update sync configuration', 500);
    }
  }
);

