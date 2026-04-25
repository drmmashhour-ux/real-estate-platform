import { NextRequest } from "next/server";
import { runScheduledReports } from "@/modules/executive-reporting/report-scheduler.service";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/cron/executive-reports — Bearer $CRON_SECRET
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runScheduledReports(new Date());
  return Response.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
