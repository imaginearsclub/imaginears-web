import { auth } from "@/lib/auth";

export async function getServerSession() {
    // Works in RSC/route handlers
    const session = await auth.api.getSession();
    return session; // { sessionId, user, ... } or null
}

export async function requireAdmin() {
    const s = await getServerSession();
    if (!s?.user?.roles?.includes("admin")) return null;
    return s;
}
