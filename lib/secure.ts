import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("UNAUTHORIZED");
    return session.user as any; // { email, role, ... }
}

export async function requireAdmin() {
    const user = await requireUser();
    if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
    return user;
}
