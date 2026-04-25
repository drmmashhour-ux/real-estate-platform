import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Check DB
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        db: "ok",
        api: "ok"
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: "Health check failed"
    }, { status: 503 });
  }
}
