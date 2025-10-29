import { NextResponse } from "next/server";
import { AppStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import { createApiHandler } from "@/lib/api-middleware";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation schema for query parameters
const applicationsQuerySchema = z.object({
  status: z.enum(["New", "InReview", "Approved", "Rejected"]).optional(),
  q: z.string().max(200).optional().default(""),
  take: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().max(50).optional().default(""),
});

type ApplicationsQuery = z.infer<typeof applicationsQuerySchema>;

/**
 * Build search query for applications
 */
function buildSearchQuery(status: AppStatus | undefined, searchTerm: string) {
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
 * GET /api/admin/applications
 * List applications with filtering and search
 * 
 * Security: Admin authentication and rate limiting handled by middleware
 */
export const GET = createApiHandler(
  {
    auth: "admin",
    rateLimit: {
      key: "admin:applications:list",
      limit: 60,
      window: 60,
      strategy: "sliding-window",
    },
    validateQuery: applicationsQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const { status, q: searchTerm, take, cursor } = validatedQuery as ApplicationsQuery;

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

    log.info("Applications listed", { 
      userId, 
      count: items.length, 
      status, 
      hasSearch: !!searchTerm 
    });

    return NextResponse.json({ items, nextCursor }, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  }
);