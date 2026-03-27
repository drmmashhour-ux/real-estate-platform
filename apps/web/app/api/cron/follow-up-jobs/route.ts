import { NextRequest } from "next/server";
import { processDueFollowUpJobs } from "@/lib/ai/follow-up/process-jobs";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/follow-up-jobs — run due SMS/voice follow-up jobs.
 * Secure with header: Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { processed } = await processDueFollowUpJobs(50);
  return Response.json({ ok: true, processed });
}
