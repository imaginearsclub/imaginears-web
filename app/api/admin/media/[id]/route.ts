import { NextResponse } from "next/server";
import { deleteMedia, updateMedia } from "@/lib/media-library";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { checkMediaPermission } from "../utils";
import { z } from "zod";

// Validation schema for media updates
const updateMediaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

/**
 * DELETE /api/admin/media/[id]
 * Delete a file or directory
 * 
 * Security: Requires authentication and media:delete permission
 */
export const DELETE = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:delete",
      limit: 30, // Reasonable limit for deletions
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId, params }) => {
    const id = params!['id']!;

    // Check permission
    if (!(await checkMediaPermission(userId!, "media:delete", id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteMedia(id, userId!);

    log.info("Media deleted", { userId, mediaId: id });

    return NextResponse.json({ success: true });
  }
);

/**
 * PATCH /api/admin/media/[id]
 * Update media metadata
 * 
 * Security: Requires authentication and media:upload permission
 */
export const PATCH = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:update",
      limit: 60,
      window: 60,
      strategy: "sliding-window",
    },
    validateBody: updateMediaSchema,
    maxBodySize: 10000, // 10KB max
  },
  async (_req, { userId, params, validatedBody }) => {
    const id = params!['id']!;
    const body = validatedBody as z.infer<typeof updateMediaSchema>;

    // Check permission
    if (!(await checkMediaPermission(userId!, "media:upload", id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Filter out undefined values for exact optional property types
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([, v]) => v !== undefined)
    ) as { name?: string; description?: string; tags?: string[] };

    const updated = await updateMedia(id, updateData);

    log.info("Media updated", { userId, mediaId: id, fields: Object.keys(updateData) });

    return NextResponse.json(updated);
  }
);