import { NextRequest } from "next/server";
import { syncInstagramPublishedMetrics } from "@/src/modules/growth-automation/application/syncInstagramPublishedMetrics";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/growth-instagram-insights — snapshot likes/comments for published IG posts.
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const out = await syncInstagramPublishedMetrics({ take: 60 });
  return Response.json(out);
}
