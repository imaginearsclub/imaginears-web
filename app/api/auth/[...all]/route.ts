import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Better-Auth Catch-All Handler
 * 
 * This route handles all Better-Auth endpoints:
 * - /api/auth/sign-in/* - Authentication endpoints
 * - /api/auth/sign-out - Sign out endpoint  
 * - /api/auth/session - Session management
 * - /api/auth/callback/* - OAuth callbacks
 * - And other Better-Auth internal routes
 * 
 * IMPORTANT: Do not heavily modify this file.
 * Better-Auth manages its own security, rate limiting, and functionality.
 * 
 * For custom auth logic, use:
 * - /api/login (our proxy with custom rate limiting)
 * - /api/logout (our proxy with custom cookie clearing)
 * - /api/auth/session-check (our middleware validation endpoint)
 */
export const { GET, POST } = toNextJsHandler(auth);
