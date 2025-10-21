import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

// Roles that are allowed to access admin functionality
const ADMIN_ROLES = new Set(["owner", "admin"]);

/**
 * Fetch the current Better-Auth session on the server.
 * Works in Server Components and Route Handlers.
 */
// noinspection JSUnusedGlobalSymbols
export async function getServerSession() {
    // Read request headers provided by Next.js in the current server context
    const h = nextHeaders();
    // Convert ReadonlyHeaders to a mutable Headers instance for libraries that expect standard Headers
    const hdrs = new Headers(h as unknown as Headers);

    return await auth.api.getSession({ headers: hdrs }); // { sessionId, user, ... } | null
}

/**
 * Ensure the current user is an admin (owner/admin org role).
 * Returns the session when authorized, or null when unauthorized.
 * Fails closed on any error.
 */
// noinspection JSUnusedGlobalSymbols
export async function requireAdmin() {
    try {
        const h = nextHeaders();
        const hdrs = new Headers(h as unknown as Headers);

        // Do both requests in parallel for better latency
        const [session, roleResult] = await Promise.all([
            auth.api.getSession({ headers: hdrs }),
            auth.api.getActiveMemberRole({ headers: hdrs })
        ]);

        if (!session) return null;

        const roleRaw = (roleResult?.role ?? undefined) as string | string[] | undefined;
        const roles = Array.isArray(roleRaw) ? roleRaw : roleRaw ? [roleRaw] : [];
        const isAdmin = roles.some((r) => ADMIN_ROLES.has(r));
        if (!isAdmin) return null;

        return session;
    } catch {
        // Fail closed: on any error, treat as unauthorized
        return null;
    }
}
