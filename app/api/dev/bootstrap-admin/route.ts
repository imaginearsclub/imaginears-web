import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";

// This route assumes Better-Auth is configured with the Organization plugin.
// It will:
//  - ensure there's at least one organization (create "Imaginears" if none)
//  - ensure the current user is an OWNER in that org
//  - set active organization to that org (if the API is available)

export async function POST() {
    const h = await nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);

    // Must be authenticated (we just signed up)
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session?.data) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
    }

    // 1) list orgs I have access to
    const orgList = await auth.api.listOrganizations({ headers: hdrs });
    let orgId = orgList?.data?.[0]?.id as string | undefined;

    // 2) create if none exists
    if (!orgId) {
        const created = await auth.api.createOrganization({ headers: hdrs, body: { name: "Imaginears" } });
        if (!created?.data?.id) {
            return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
        }
        orgId = created.data.id;
    }

    // 3) add me as owner if I'm not a member yet
    // Try to add as owner; if already member, try to promote
    try {
        await auth.api.addMember({ headers: hdrs, body: { organizationId: orgId!, role: ["owner"] } });
    } catch {
        // maybe already a member; try updating role if such endpoint exists
        try {
            await auth.api.updateMemberRole?.({
                headers: hdrs,
                body: { organizationId: orgId!, userId: session.data.user.id, role: ["owner"] },
            } as any);
        } catch {
            /* ignore if not supported; creator is usually owner by default */
        }
    }

    // 4) set active organization for this session (if supported by your version)
    try {
        await auth.api.setActiveOrganization?.({ headers: hdrs, body: { organizationId: orgId! } } as any);
    } catch {
        /* optional */
    }

    return NextResponse.json({ ok: true, organizationId: orgId });

}

