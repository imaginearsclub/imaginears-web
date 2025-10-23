import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Readiness probe for Kubernetes/Docker deployments.
 * Returns 200 if the application is ready to serve traffic.
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      { status: "ready", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { 
        status: "not ready", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString() 
      },
      { status: 503 }
    );
  }
}
