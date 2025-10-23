import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export const runtime = "nodejs";

interface HealthStatus {
  status: "healthy" | "unhealthy";
  timestamp: string;
  services: {
    database: "up" | "down";
    cache: "up" | "down";
  };
  uptime: number;
  version?: string;
}

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    // Test database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    // Test cache
    const cacheStart = Date.now();
    await cache.set("health-check", "ok", 10);
    const cacheValue = await cache.get("health-check");
    const cacheLatency = Date.now() - cacheStart;
    
    const isHealthy = cacheValue === "ok";
    
    const healthStatus: HealthStatus = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      services: {
        database: "up",
        cache: isHealthy ? "up" : "down",
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
    };

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...healthStatus,
      responseTime: `${responseTime}ms`,
      databaseLatency: `${dbLatency}ms`,
      cacheLatency: `${cacheLatency}ms`,
    }, {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
    
  } catch (error) {
    const healthStatus: HealthStatus = {
      status: "unhealthy",
      timestamp,
      services: {
        database: "down",
        cache: "down",
      },
      uptime: process.uptime(),
    };

    return NextResponse.json({
      ...healthStatus,
      error: error instanceof Error ? error.message : "Unknown error",
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }
}
