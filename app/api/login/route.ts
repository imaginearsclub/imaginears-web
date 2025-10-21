import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, AppSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const emailNorm = String(email || "").trim().toLowerCase();
        const pass = String(password || "");

        if (!emailNorm || !pass) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email: emailNorm } });
        if (!user?.passwordHash) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const ok = await bcrypt.compare(pass, user.passwordHash);
        if (!ok) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const session = await getIronSession<AppSession>(await cookies(), sessionOptions);
        session.user = {
            id: user.id,
            email: user.email || emailNorm,
            role: (user as any).role ?? "ADMIN",
            name: user.name ?? null,
        };
        await session.save();

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("login error", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
