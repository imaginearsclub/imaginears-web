import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { uploadMedia, validateFile, MEDIA_CONFIG } from "@/lib/media";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limiter";

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * POST /api/media/upload
 * Upload a media file
 * 
 * Rate limited: 10 uploads per hour per user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting per user (10 uploads per hour)
    const rateLimit = await rateLimitMiddleware(req, RATE_LIMITS.UPLOAD, session.user.id);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Upload limit exceeded",
          message: `You can upload ${rateLimit.limit} files per hour. Try again in ${Math.ceil(rateLimit.resetAfter / 60)} minutes.`,
          resetAfter: rateLimit.resetAfter,
        },
        { status: 429, headers: rateLimit.headers }
      );
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "general";
    const altText = formData.get("altText") as string | null;
    const description = formData.get("description") as string | null;
    const resizeWidth = formData.get("resizeWidth") as string | null;
    const resizeHeight = formData.get("resizeHeight") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateFile({
      size: file.size,
      mimetype: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate type
    if (!["avatar", "banner", "general"].includes(type)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Prepare resize options
    const resize: { width?: number; height?: number } = {};
    if (resizeWidth) resize.width = parseInt(resizeWidth);
    if (resizeHeight) resize.height = parseInt(resizeHeight);

    // Use default sizes for avatars and banners if no custom resize specified
    if (!resizeWidth && !resizeHeight) {
      if (type === "avatar") {
        resize.width = MEDIA_CONFIG.avatarSizes.large.width;
        resize.height = MEDIA_CONFIG.avatarSizes.large.height;
      } else if (type === "banner") {
        resize.width = MEDIA_CONFIG.bannerSizes.large.width;
        resize.height = MEDIA_CONFIG.bannerSizes.large.height;
      }
    }

    // Upload media
    const media = await uploadMedia({
      file: buffer,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      type: type as "avatar" | "banner" | "general",
      uploadedById: session.user.id,
      ...(altText && { altText }),
      ...(description && { description }),
      ...(Object.keys(resize).length > 0 && { resize }),
    });

    return NextResponse.json(media, {
      headers: rateLimit.headers, // Include rate limit info
    });
  } catch (error: any) {
    console.error("[Media Upload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

