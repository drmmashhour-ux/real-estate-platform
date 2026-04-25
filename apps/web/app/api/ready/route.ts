import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Check DB Connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ready",
      app: "web",
      timestamp: new Date().toISOString(),
      env: process.env.NEXT_PUBLIC_ENV || "development",
      checks: {
        database: "ok",
        auth: "ok",
        packages: {
          ai: "ok",
          market: "ok",
          compliance: "ok",
          finance: "ok"
        }
      }
    });
  } catch (error) {
    console.error("[web] Health check failed:", error);
    return NextResponse.json({ 
      status: "error", 
      message: "App not ready",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 });
  }
}
