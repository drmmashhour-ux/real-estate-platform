import { NextRequest } from "next/server";
import {
  cronNotConfigured,
  cronUnauthorized,
  verifyCronBearer,
} from "@/lib/server/internal-cron-auth";
import { runGrowthV2SeoDraftGenerationBatch } from "@/src/modules/growth/growth-v2.service";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET?.trim()) return cronNotConfigured();
  if (!verifyCronBearer(request)) return cronUnauthorized();
  if (!engineFlags.growthV2 || !engineFlags.seoDraftGenerationV2) {
    return Response.json({ ok: false, error: "draft flags disabled" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const r = await runGrowthV2SeoDraftGenerationBatch(Math.min(80, body.limit ?? 25));
  return Response.json({ ok: true, drafts: r.drafts });
}
