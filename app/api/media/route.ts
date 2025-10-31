import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { listMedia } from "@/lib/media";

/**
 * GET /api/media
 * List media files
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "avatar" | "banner" | "general" | null;
    const uploadedById = searchParams.get("uploadedById");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await listMedia({
      type: type || undefined,
      uploadedById: uploadedById || undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Media List] Error:", error);
    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 }
    );
  }
}

