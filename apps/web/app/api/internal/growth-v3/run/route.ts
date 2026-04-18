import { NextRequest } from "next/server";
import { cronNotConfigured, cronUnauthorized, verifyCronBearer } from "@/lib/server/internal-cron-auth";
import { runGrowthV3Scan } from "@/src/modules/growth/growth-v3.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/growth-v3/run — topic clusters, internal links, refresh jobs, flywheel, experiments, revenue, referral candidates.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  void request;
  const summary = await runGrowthV3Scan();
  return Response.json({ ok: true, summary });
}
