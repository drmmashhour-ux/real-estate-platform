import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { expandSeoPageCandidatesV2 } from "@/src/modules/growth/seo/seo-page-candidate-expander";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.growthV2) {
    return Response.json({ ok: false, error: "FEATURE_GROWTH_V2 disabled" }, { status: 403 });
  }
  void request;
  const r = await expandSeoPageCandidatesV2();
  return Response.json({ ok: true, upserts: r.upserts });
}
