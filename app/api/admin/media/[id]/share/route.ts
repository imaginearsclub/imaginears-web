import { NextResponse } from "next/server";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { generateShareLink } from "@/lib/media-library";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";
import { z } from "zod";

// Validation schema for share link creation
const createShareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/**
 * POST /api/admin/media/[id]/share
 * Generate a shareable link for a file
 * 
 * Security: Requires authentication and media:upload permission
 */
export const POST = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:share:create",
      limit: 30, // Limit share link creation
      window: 60,
      strategy: "sliding-window",
    },
    validateBody: createShareSchema,
    maxBodySize: 1000, // 1KB max
  },
  async (req, { userId, params, validatedBody }) => {
    const id = params!['id']!;
    const { expiresInDays } = validatedBody as z.infer<typeof createShareSchema>;

    // Check permission
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { role: true },
    });

    if (!user || !(await userHasPermissionAsync(user.role, "media:upload"))) {
      log.warn("Media share permission denied", { userId, role: user?.role, mediaId: id });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const shareToken = await generateShareLink(id, expiresInDays);
    const shareUrl = `${req.nextUrl.origin}/share/${shareToken}`;

    log.info("Media share link created", { userId, mediaId: id, expiresInDays });

    return NextResponse.json({ shareUrl, shareToken }, { status: 201 });
  }
);

/**
 * DELETE /api/admin/media/[id]/share
 * Disable sharing for a file
 * 
 * Security: Requires authentication and media:upload permission
 */
export const DELETE = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:share:delete",
      limit: 30,
      window: 60,
      strategy: "sliding-window",
    },
  },
  async (_req, { userId, params }) => {
    const id = params!['id']!;

    // Check permission
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { role: true },
    });

    if (!user || !(await userHasPermissionAsync(user.role, "media:upload"))) {
      log.warn("Media unshare permission denied", { userId, role: user?.role, mediaId: id });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.media.update({
      where: { id },
      data: {
        shareEnabled: false,
        shareToken: null,
        shareExpires: null,
      },
    });

    log.info("Media sharing disabled", { userId, mediaId: id });

    return NextResponse.json({ success: true });
  }
);