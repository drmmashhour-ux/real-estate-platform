import { NextRequest } from "next/server";

import { processDueCentrisDominationJobs } from "@/modules/centris-conversion/centris-followup.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/centris-domination-followup — sends Day 2–5 Centris nurture emails when due.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processDueCentrisDominationJobs(40);

  return Response.json({ ok: true, processed });
}
