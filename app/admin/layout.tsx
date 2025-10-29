import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import AdminChrome from "@/components/admin/AdminChrome";
import { redirect } from "next/navigation";
import AdminProviders from "@/components/admin/AdminProviders";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const h = await nextHeaders();
    const hdrs = new Headers(h as unknown as Headers);

    // Security: Ensure user is authenticated
    const session = await auth.api.getSession({ headers: hdrs });
    if (!session) {
        redirect("/login?callbackUrl=/admin/dashboard");
    }

    return (
        <AdminProviders>
            <AdminChrome>
                {children}
            </AdminChrome>
        </AdminProviders>
    );
}
