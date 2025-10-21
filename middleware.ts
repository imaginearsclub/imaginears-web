import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
    const { pathname, searchParams } = req.nextUrl;

    if (pathname.startsWith("/admin")) {
        // Read session cookies from the request
        const session = await auth.api.getSession({ headers: req.headers });
        const roles = (await auth.api.getActiveMemberRole({ headers: req.headers }))?.data?.role ?? [];

        const isAdmin = Array.isArray(roles) ? roles.some((r: string) => ["owner","admin"].includes(r)) : false;
        if (!session || !isAdmin) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("callbackUrl", pathname + (searchParams.size ? `?${searchParams}` : ""));
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
