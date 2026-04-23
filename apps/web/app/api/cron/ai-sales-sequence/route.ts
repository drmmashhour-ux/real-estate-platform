import { NextRequest } from "next/server";

import { processDueAiSalesSequenceJobs } from "@/modules/ai-sales-agent/ai-sales-sequence.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/ai-sales-sequence — processes nurture jobs (`ai_sales_seq_*`).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processDueAiSalesSequenceJobs(40);

  return Response.json({ ok: true, processed });
}
