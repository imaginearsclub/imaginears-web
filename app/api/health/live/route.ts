import { NextResponse } from "next/server";

/**
 * Liveness probe for Kubernetes/Docker deployments.
 * Returns 200 if the application is alive (not crashed).
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: "alive", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { 
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
