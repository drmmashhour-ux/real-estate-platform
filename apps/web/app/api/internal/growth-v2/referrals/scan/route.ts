import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { runGrowthV2ReferralAbuseScan } from "@/src/modules/growth/growth-v2.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.referralEngineV2) {
    return Response.json({ ok: false, error: "FEATURE_REFERRAL_ENGINE_V2 disabled" }, { status: 403 });
  }
  void request;
  const r = await runGrowthV2ReferralAbuseScan();
  return Response.json({ ok: true, ...r });
}
