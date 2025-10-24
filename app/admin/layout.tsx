import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminChrome from "@/components/admin/AdminChrome";
import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/common/Tooltip";

export const runtime = "nodejs";

/**
 * Performance: Cache organization setup check for 5 minutes
 * This prevents running the organization bootstrap logic on every page load
 */
export const revalidate = 300;

/**
 * Helper: Ensure user has an organization (creates one if needed)
 * Performance: Direct database/auth calls instead of fetch()
 * Security: Proper error logging for debugging
 */
async function ensureUserOrganization(headers: Headers, session: any): Promise<void> {
    try {
        // Quick check: does user already have an active role?
        try {
            await auth.api.getActiveMemberRole({ headers });
            return; // All good, user has active org
        } catch {
            // No active role, continue to setup
        }

        // Performance: Run bootstrap and org list checks in parallel
        const [_, orgList] = await Promise.all([
            // Bootstrap first org if this is a brand new installation
            bootstrapFirstOrganization(headers, session),
            // Get user's existing orgs
            auth.api.listOrganizations({ headers }).catch(() => []),
        ]);

        let orgId = orgList?.[0]?.id as string | undefined;

        // If user still has no org, create one for them
        if (!orgId) {
            const baseName = session?.user?.name?.trim() || "Imaginears";
            const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const suffix = (session?.user?.id || crypto.randomUUID()).toString().slice(0, 8).toLowerCase();
            const slug = `${baseSlug || "imaginears"}-${suffix}`;

            try {
                const created = await auth.api.createOrganization({
                    headers,
                    body: { name: baseName, slug },
                } as any);
                orgId = (created as any)?.data?.id ?? (created as any)?.id as string | undefined;
            } catch (err) {
                console.error("[Admin Layout] Failed to create organization:", err);
            }
        }

        // Set the org as active if we have one
        if (orgId) {
            // Retry logic to handle MySQL session locking issues
            let retries = 2;
            while (retries > 0) {
                try {
                    await auth.api.setActiveOrganization?.({ 
                        headers, 
                        body: { organizationId: orgId } 
                    } as any);
                    break; // Success
                } catch (err: any) {
                    retries--;
                    
                    // Check for MySQL lock error (error code 1020)
                    const isLockError = err?.message?.includes("Record has changed") || 
                                       err?.message?.includes("1020") ||
                                       err?.message?.includes("HY000");
                    
                    if (isLockError && retries > 0) {
                        // Wait 150ms before retry to let other operations complete
                        console.warn("[Admin Layout] Session lock detected, retrying...");
                        await new Promise(resolve => setTimeout(resolve, 150));
                    } else {
                        // Log error but don't crash - org will be set on next page load
                        console.error("[Admin Layout] Failed to set active organization:", err);
                        break;
                    }
                }
            }
        }
    } catch (err) {
        // Security: Log errors for debugging, but don't crash the admin panel
        console.error("[Admin Layout] Error ensuring user organization:", err);
    }
}

/**
 * Helper: Bootstrap first organization for new installations
 * Performance: Direct database access instead of HTTP fetch
 * Security: Proper validation and error handling
 */
async function bootstrapFirstOrganization(headers: Headers, session: any): Promise<void> {
    try {
        const userId: string | undefined = session?.user?.id;
        if (!userId) return;

        // Quick check: if any org exists, skip (most common case)
        const orgCount = await prisma.organization.count({ take: 1 });
        if (orgCount > 0) return;

        // Double-check user isn't already a member (paranoia)
        const existingMembership = await prisma.member.findFirst({ 
            where: { userId },
            take: 1,
        });
        if (existingMembership) return;

        // Create first organization
        const baseName = session?.user?.name?.trim() || "Imaginears";
        const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const suffix = userId.slice(0, 8).toLowerCase();
        const slug = `${baseSlug || "imaginears"}-${suffix}`;

        const now = new Date();
        const orgId = crypto.randomUUID();

        const defaultRoles = {
            roles: [
                { name: "owner", permissions: ["*"] },
                { name: "admin", permissions: ["manage:all"] },
                { name: "member", permissions: [] },
            ],
        };

        // Performance: Create org and member in a transaction
        await prisma.$transaction([
            prisma.organization.create({
                data: {
                    id: orgId,
                    name: baseName,
                    slug,
                    createdAt: now,
                    metadata: JSON.stringify(defaultRoles),
                },
            }),
            prisma.member.create({
                data: {
                    id: crypto.randomUUID(),
                    organizationId: orgId,
                    userId,
                    role: "owner",
                    createdAt: now,
                },
            }),
        ]);

        // Try to set as active (with retry for MySQL locking issues)
        let retries = 2;
        while (retries > 0) {
            try {
                await auth.api.setActiveOrganization?.({ 
                    headers, 
                    body: { organizationId: orgId } 
                } as any);
                break; // Success
            } catch (err: any) {
                retries--;
                const isLockError = err?.message?.includes("Record has changed") || 
                                   err?.message?.includes("1020") ||
                                   err?.message?.includes("HY000");
                
                if (isLockError && retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                } else {
                    // Optional, will be set in next step
                    break;
                }
            }
        }

        console.log(`[Admin Layout] Bootstrapped first organization for user ${userId}`);
    } catch (err) {
        // Security: Log but don't throw - this is best-effort
        console.error("[Admin Layout] Failed to bootstrap first organization:", err);
    }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // Security: Middleware already enforces session presence. This is a secondary guard.
    const h = await nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);

    // Security: Ensure user is authenticated
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) {
        redirect("/login?callbackUrl=/admin/dashboard");
    }

    // Performance: Ensure organization setup (with caching via revalidate)
    await ensureUserOrganization(hdrs, session);

    return (
        <TooltipProvider delayDuration={300} skipDelayDuration={100}>
            <AdminChrome>
                {children}
            </AdminChrome>
        </TooltipProvider>
    );
}
