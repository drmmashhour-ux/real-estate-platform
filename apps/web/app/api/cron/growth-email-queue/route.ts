import { NextRequest } from "next/server";
import { processGrowthEmailQueue } from "@/src/workers/emailWorker";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/growth-email-queue — drain `growth_email_queue`.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await processGrowthEmailQueue(40);
  return Response.json({ ok: true, ...result });
}
