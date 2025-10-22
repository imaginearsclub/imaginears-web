import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import AdminChrome from "@/components/admin/AdminChrome";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // Middleware already enforces session presence at the edge. This is a secondary guard.
    const h = await nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);

    // Ensure user is authenticated
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) {
        // Redirect instead of rendering a blank page
        redirect("/login?callbackUrl=/admin/dashboard");
    }

    // Best-effort: ensure an active organization; if none exists, create a starter one.
    try {
        await auth.api.getActiveMemberRole({ headers: hdrs });
    } catch {
        try {
            // First, try our bootstrap route (creates the very first org and assigns current user as owner)
            try {
                await fetch("/api/bootstrap-first-org", { method: "POST", headers: hdrs });
            } catch {}

            const orgList = await auth.api.listOrganizations({ headers: hdrs });
            let orgId = orgList?.[0]?.id as string | undefined;

            if (!orgId) {
                // Create a lightweight default org for the user so admin pages have context
                const baseName = session?.user?.name?.trim() || "Imaginears";
                const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                const suffix = (session?.user?.id || Math.random().toString(36).slice(2, 8)).toString().slice(0, 6).toLowerCase();
                const slug = [baseSlug || "imaginears", suffix].join("-");

                const created = await auth.api.createOrganization({
                    headers: hdrs,
                    body: {
                        name: baseName,
                        slug,
                    },
                } as any);
                orgId = (created as any)?.data?.id ?? (created as any)?.id as string | undefined;
            }

            if (orgId) {
                await auth.api.setActiveOrganization?.({ headers: hdrs, body: { organizationId: orgId } } as any);
            }
        } catch {
            // Ignore — UI should still render, and pages can handle lack of role/org gracefully.
        }
    }

    return (
        <AdminChrome>
            {children}
        </AdminChrome>
    );
}
