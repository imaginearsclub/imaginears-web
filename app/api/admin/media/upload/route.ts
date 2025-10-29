import { NextResponse } from "next/server";
import { userHasPermissionAsync } from "@/lib/rbac-server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/media-library";
import { triggerWebhook, WEBHOOK_EVENTS } from "@/lib/webhooks";
import { createApiHandler } from "@/lib/api-middleware";
import { log } from "@/lib/logger";

// Security: Max file size 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const VALID_CATEGORIES = ["audio", "images", "documents"];

/**
 * POST /api/admin/media/upload
 * Upload a file
 * 
 * Security: Requires authentication and media:upload permission
 * Note: multipart/form-data handling requires manual parsing
 */
export const POST = createApiHandler(
  {
    auth: "user",
    rateLimit: {
      key: "media:upload",
      limit: 20, // Limit file uploads per minute
      window: 60,
      strategy: "sliding-window",
    },
    // Note: maxBodySize not used for multipart - handled by file size check
  },
  async (req, { userId }) => {
    // Check permission
    const user = await prisma.user.findUnique({
      where: { id: userId! },
      select: { role: true },
    });

    if (!user || !(await userHasPermissionAsync(user.role, "media:upload"))) {
      log.warn("Media upload permission denied", { userId, role: user?.role });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const parentId = formData.get("parentId") as string | null;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string | undefined;
    const tagsStr = formData.get("tags") as string | undefined;

    // Security: Validate required fields
    if (!file || !category) {
      log.warn("Media upload missing required fields", { userId, hasFile: !!file, category });
      return NextResponse.json(
        { error: "File and category are required" },
        { status: 400 }
      );
    }

    // Security: Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      log.warn("Media upload invalid category", { userId, category });
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Security: Check file size
    if (file.size > MAX_FILE_SIZE) {
      log.warn("Media upload file too large", { userId, size: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    // Convert File to Buffer
    let buffer: Buffer | null = Buffer.from(await file.arrayBuffer());
    const tags = tagsStr ? JSON.parse(tagsStr) : undefined;

    let uploadedFile;
    try {
      uploadedFile = await uploadFile({
        file: buffer,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        parentId: parentId || null,
        category: category as "audio" | "images" | "documents",
        userId: userId!,
        ...(description && { description }),
        ...(tags && { tags }),
      });
    } finally {
      // Memory: Explicitly release buffer to help GC
      buffer = null;
      if (global.gc) global.gc(); // Force GC if --expose-gc flag is set (optional)
    }

    log.info("Media file uploaded", { 
      userId, 
      fileId: uploadedFile.id, 
      filename: file.name, 
      size: file.size,
      category 
    });

    // Trigger webhook (non-blocking)
    triggerWebhook(WEBHOOK_EVENTS.MEDIA_UPLOADED, {
      id: uploadedFile.id,
      name: uploadedFile.name,
      filename: uploadedFile.filename,
      category: uploadedFile.category,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
      url: uploadedFile.url,
    }, {
      userId: userId!,
    }).catch(err => log.error("Media upload webhook trigger failed", { error: err, userId }));

    return NextResponse.json(uploadedFile, { status: 201 });
  }
);

