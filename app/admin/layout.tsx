import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    // middleware already redirects; this is a secondary guard + gives you the name
    const session = await auth.api.getSession();
    const role = await auth.api.getActiveMemberRole();

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
