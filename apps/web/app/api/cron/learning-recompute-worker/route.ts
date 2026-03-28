import { NextRequest } from "next/server";
import { recomputeLearningRecommendations } from "@/src/workers/learningRecomputeWorker";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/learning-recompute-worker — rollup template performance.
 * Authorization: Bearer $CRON_SECRET
 *
 * Scheduling: run **before** the autonomous deal-closer cron when both are enabled, so rollups
 * improve template selection first and orchestration acts on better messaging decisions.
 * See docs/ai/GROWTH-AI-WORKER-ORDER.md.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await recomputeLearningRecommendations();
    return Response.json({ ok: true, ...result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "recompute_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
