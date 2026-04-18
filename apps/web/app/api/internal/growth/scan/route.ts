import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { runGrowthOpportunityScan } from "@/src/modules/growth/growth.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

/** POST /api/internal/growth/scan — growth opportunity + SEO candidates (Bearer CRON_SECRET). */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.growthAutopilotV1) {
    return Response.json({ ok: false, error: "FEATURE_GROWTH_AUTOPILOT_V1 disabled" }, { status: 403 });
  }

  void request;
  const summary = await runGrowthOpportunityScan();
  return Response.json({ ok: true, summary });
}
