import { NextResponse } from "next/server";
import { createDirectory } from "@/lib/media-library";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkMediaPermission } from "./utils";
import { z } from "zod";

// Validation schema for directory creation
const createDirectorySchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().max(50).optional().nullable(),
  category: z.enum(["audio", "images", "documents"]),
  description: z.string().max(1000).optional(),
});

/**
 * POST /api/admin/media/directory
 * Create a new directory
 * 
 * Security: Requires authentication and media:manage_directories permission
 */
export const POST = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:directory:create",
      limit: 30, // Reasonable limit for directory creation
      window: 60,
      strategy: "sliding-window",
    },
    validateBody: createDirectorySchema,
    maxBodySize: 5000, // 5KB max
  },
  async (_req, { userId, validatedBody }) => {
    const { name, parentId, category, description } = validatedBody as z.infer<typeof createDirectorySchema>;

    // Check permission
    if (!(await checkMediaPermission(userId!, "media:manage_directories"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const directory = await createDirectory({
      name,
      parentId: parentId || null,
      category,
      userId: userId!,
      ...(description && { description }),
    });

    log.info("Media directory created", { userId, directoryId: directory.id, name, category });

    return NextResponse.json(directory, { status: 201 });
  }
);