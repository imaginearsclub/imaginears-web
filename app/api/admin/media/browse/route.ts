import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { initializeRootDirectories } from "@/lib/media-library";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkMediaPermission, formatMediaResponse } from "../utils";
import { z } from "zod";

// Validation schema for query parameters
const browseQuerySchema = z.object({
  parentId: z.string().max(50).optional(),
  category: z.enum(["audio", "images", "documents"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100), // Performance: Prevent loading too many items
  cursor: z.string().optional(), // For cursor-based pagination
});

/**
 * GET /api/admin/media/browse
 * Browse directory contents
 * 
 * Security: Requires authentication and media:read permission
 */
export const GET = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:browse",
      limit: 120, // Allow frequent browsing
      window: 60,
      strategy: "sliding-window",
    },
    validateQuery: browseQuerySchema,
  },
  async (_req, { userId, validatedQuery }) => {
    const { parentId, category, limit, cursor } = validatedQuery as z.infer<typeof browseQuerySchema>;

    // Check permission
    if (!(await checkMediaPermission(userId!, "media:read"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Initialize root directories if needed
    await initializeRootDirectories(userId!);

    // Performance: Add pagination support
    const where: Prisma.MediaWhereInput = { parentId: parentId || null };
    if (category) where.category = category;
    if (cursor) where.id = { lt: cursor }; // Cursor-based pagination

    const items = await prisma.media.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there are more
      orderBy: [
        { isDirectory: "desc" }, // Directories first
        { name: "asc" },
      ],
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    const hasMore = items.length > limit;
    const contents = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && contents.length > 0 ? contents[contents.length - 1]!.id : null;

    const result = contents.map((item) => formatMediaResponse(item));

    log.info("Media directory browsed", { userId, parentId, category, itemCount: result.length, hasMore });

    return NextResponse.json({
      items: result,
      hasMore,
      nextCursor,
    });
  }
);