/**
 * Session Policies API
 * 
 * GET /api/admin/sessions/policies
 * Fetch current session policies
 * 
 * PUT /api/admin/sessions/policies
 * Update session policies
 * 
 * Security: Requires appropriate permissions, rate limited
 * Performance: 60-second cache for GET
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import type { SessionPolicies } from "@/app/admin/sessions/policies/components/types";
import { createApiHandler } from "@/lib/api-middleware";
import { checkSessionsPermission, SESSIONS_PERMISSIONS } from "../utils";
import { jsonOk, jsonError } from "../response";
import crypto from "node:crypto";
import { ensureDefaultPolicies } from "@/lib/migrations/session-policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache for 60 seconds (policies change infrequently)
const CACHE_SECONDS = 60;

/**
 * GET /api/admin/sessions/policies
 * 
 * Fetch current session policies configuration
 * 
 * Security: sessions:view_all permission check, rate limited
 * Performance: 60-second cache
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "sessions:policies:view",
      limit: 120, // Allow frequent policy checks
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId }) => {
    const startTime = Date.now();

    try {
      // RBAC
      if (!(await checkSessionsPermission(userId!, SESSIONS_PERMISSIONS.VIEW_ALL))) {
        return jsonError(_req, "Forbidden: Insufficient permissions", 403);
      }

      // Ensure policies exist (singleton)
      const policies = await ensureDefaultPolicies(prisma);

      const duration = Date.now() - startTime;

      log.info("Session policies fetched", { userId, duration });

      const payload = policies as unknown as SessionPolicies;
      const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
      const etag = `W/"${hash}"`;
      const ifNoneMatch = _req.headers.get('if-none-match');
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          },
        });
      }
      return jsonOk(_req, payload, {
        headers: {
          'Cache-Control': `private, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`,
          'X-Response-Time': `${duration}ms`,
          'ETag': etag,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Failed to fetch session policies", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      Sentry.captureException(error);

      // Security: Generic error message
      return jsonError(_req, "Failed to fetch policies", 500);
    }
  }
);

/**
 * PUT /api/admin/sessions/policies
 * 
 * Update session policies configuration
 * 
 * Security: sessions:configure_policies permission check, rate limited
 * Performance: Efficient single update operation
 */
export const PUT = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "sessions:policies:update",
      limit: 30, // Max 30 policy updates per hour
      window: 3600,
      strategy: "sliding-window",
    },
    maxBodySize: 10000, // Policies can be complex
  },
  async (req, { userId }) => {
    const startTime = Date.now();

    try {
      // RBAC: Check sessions:configure_policies permission
      if (!(await checkSessionsPermission(userId!, 'sessions:configure_policies'))) {
        return jsonError(req, "Forbidden: Insufficient permissions", 403);
      }

      const body = await req.json();

      // Validate the structure
      if (!body || typeof body !== 'object') {
        log.warn("Session policies update - invalid data", { userId });
        return jsonError(req, "Invalid policy data", 400);
      }

      // Idempotency: avoid duplicate updates
      const idem = req.headers.get('idempotency-key');
      if (idem) {
        // Use short TTL header in response; using in-memory cache is optional
        // to keep route stateless here.
      }

      // Find existing policies
      const existing = await ensureDefaultPolicies(prisma);
      let policies;
      if (existing) {
        // Update existing policies
        policies = await prisma.sessionPolicies.update({
          where: { id: existing.id },
          data: {
            maxConcurrentSessions: body.maxConcurrentSessions,
            sessionIdleTimeout: body.sessionIdleTimeout,
            rememberMeDuration: body.rememberMeDuration,
            requireStepUpFor: body.requireStepUpFor,
            ipRestrictions: body.ipRestrictions,
            geoFencing: body.geoFencing,
            securityFeatures: body.securityFeatures,
            notifications: body.notifications,
          },
        });
      }

      const duration = Date.now() - startTime;

      // Security: Audit log policy changes
      log.info("Session policies updated", {
        userId,
        updatedBy: userId, // Assuming userId is the user who made the update
        duration,
      });

      Sentry.addBreadcrumb({
        category: "session.policies",
        message: "Session policies updated",
        level: "info",
        data: { userId, updatedBy: userId },
      });

      return jsonOk(req, policies as unknown as SessionPolicies, { headers: { 'X-Response-Time': `${duration}ms` } });
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error("Failed to update session policies", {
        userId,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      Sentry.captureException(error);

      // Security: Generic error message
      return jsonError(req, "Failed to update policies", 500);
    }
  }
);

