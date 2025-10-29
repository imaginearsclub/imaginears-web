import { NextResponse } from "next/server";
import { AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limiter";
import { log } from "@/lib/logger";
import { headers as nextHeaders } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Build search query for applications
 */
function buildSearchQuery(status: AppStatus | null, searchTerm: string) {
  const where: Record<string, unknown> = {};
  
  if (status) where["status"] = status;
  
  if (searchTerm) {
    where["OR"] = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { mcUsername: { contains: searchTerm, mode: "insensitive" } },
      { discordUser: { contains: searchTerm, mode: "insensitive" } },
    ];
  }
  
  return where;
}

/**
 * Parse and validate request parameters
 */
function parseRequestParams(searchParams: URLSearchParams) {
  const status = searchParams.get("status") as AppStatus | null;
  const searchTerm = searchParams.get("q")?.trim() || "";
  const take = Math.min(Number(searchParams.get("take") || 50), 200);
  const cursor = searchParams.get("cursor") || "";
  
  return { status, searchTerm, take, cursor };
}

export async function GET(req: Request) {
    try {
        const session = await requireAdmin();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limiting
        const h = await nextHeaders();
        const forwardedFor = h.get("x-forwarded-for");
        const clientIP = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || 
                        h.get("x-real-ip") || 
                        `user:${session.user.id}`;

        const rateLimitResult = await rateLimit(clientIP, {
            key: "admin:applications:list",
            limit: 60,
            window: 60,
            strategy: "sliding-window",
        });

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: "Too many requests" },
                { 
                    status: 429,
                    headers: {
                        "Retry-After": rateLimitResult.resetAfter.toString(),
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": "0",
                    },
                }
            );
        }

        const { searchParams } = new URL(req.url);
        const { status, searchTerm, take, cursor } = parseRequestParams(searchParams);

        const where = buildSearchQuery(status, searchTerm);

        const queryOptions = {
            where,
            orderBy: { createdAt: "desc" as const },
            take,
            select: {
                id: true,
                name: true,
                email: true,
                mcUsername: true,
                role: true,
                status: true,
                createdAt: true,
                notes: true,
            },
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        };

        const items = await prisma.application.findMany(queryOptions);

        const nextCursor = items.length === take ? items[items.length - 1]?.id ?? null : null;

        return NextResponse.json({ items, nextCursor }, {
            headers: {
                "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
        });
    } catch (e) {
        log.error("Applications list failed", { error: e });
        return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
    }
}
