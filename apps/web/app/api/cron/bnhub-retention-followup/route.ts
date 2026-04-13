import { NextRequest } from "next/server";
import { runBnhubBrowseFollowUpBatch, runBnhubNewListingsDigestBatch } from "@/lib/bnhub/bnhub-retention-followups";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/bnhub-retention-followup — browse nudges + light “new in your cities” digests (in-app).
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const browse = await runBnhubBrowseFollowUpBatch();
  const digest = await runBnhubNewListingsDigestBatch();
  return Response.json({ ok: true, browse, digest });
}
