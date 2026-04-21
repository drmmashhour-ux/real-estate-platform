import { NextRequest } from "next/server";

import { recomputeDealIntelligenceBatch } from "@/modules/deal/deal.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/deal-intelligence — refresh deterministic deal scores for active files.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processed } = await recomputeDealIntelligenceBatch(50);
  return Response.json({ ok: true, processed });
}
