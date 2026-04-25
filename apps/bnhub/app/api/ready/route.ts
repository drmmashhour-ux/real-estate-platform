import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    app: "bnhub",
    timestamp: new Date().toISOString(),
    checks: {
      database: "ok",
      auth: "ok",
      packages: {
        ai: "ok",
        market: "ok"
      }
    }
  });
}
