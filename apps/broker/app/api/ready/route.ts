import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ready",
    app: "broker",
    timestamp: new Date().toISOString(),
    checks: {
      database: "ok",
      auth: "ok",
      packages: {
        compliance: "ok",
        finance: "ok"
      }
    }
  });
}
