import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import Sidebar from "@/components/admin/Sidebar";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // middleware already redirects; this is a secondary guard + gives you the name
    const h = nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);
    const session = await auth.api.getSession({ headers: hdrs });
    const role = await auth.api.getActiveMemberRole({ headers: hdrs });

    if (!session?.data || !role?.data?.role?.some?.((r: string) => ["owner","admin"].includes(r))) {
        return null;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar userName={session.data.user.name || "Admin"} />
            <div className="flex-1">{children}</div>
        </div>
    );
}
