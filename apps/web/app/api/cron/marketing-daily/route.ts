import { NextRequest } from "next/server";

import { autoScheduleDailyContent } from "@/modules/marketing/marketing-scheduler.service";
import { runMarketingStrategyFromGrowthEngine } from "@/modules/marketing/marketing-strategy.service";

export const dynamic = "force-dynamic";

/** POST /api/cron/marketing-daily — drafts + growth-linked drafts. Bearer $CRON_SECRET */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secret || token !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drafts = await autoScheduleDailyContent();
    const growth = await runMarketingStrategyFromGrowthEngine();
    return Response.json({ ok: true, drafts, growth });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "marketing_cron_failed";
    return Response.json({ ok: false, error: msg }, { status: 500 });
  }
}
