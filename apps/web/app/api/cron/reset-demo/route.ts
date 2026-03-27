import { NextRequest, NextResponse } from "next/server";
import { safeApiError } from "@/lib/api/safe-error-response";
import { resetDemoDatabase } from "@/lib/demo-reset";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function verifyCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  return Boolean(secret && token === secret);
}

/** Vercel Cron uses GET by default; POST supported for manual triggers. */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await resetDemoDatabase();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return safeApiError(e, 500, { context: "cron/reset-demo" });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
