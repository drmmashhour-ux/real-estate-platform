import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags, revenueV4Flags } from "@/config/feature-flags";
import { estimateBrokerRoi } from "@/modules/roi/broker-roi.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { trackFunnelEvent } from "@/lib/funnel/tracker";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  leadsPerMonth: z.number().nonnegative(),
  qualificationRate: z.number().min(0).max(1),
  closeRate: z.number().min(0).max(1),
  avgGrossCommissionPerDeal: z.number().nonnegative(),
  platformSuccessFeePercent: z.number().min(0).max(0.5),
  monthlySubscriptionDollars: z.number().nonnegative().optional(),
  leadPriceDollars: z.number().nonnegative().optional(),
});

export async function POST(req: Request) {
  if (!hostEconomicsFlags.roiCalculatorV1 && !revenueV4Flags.monetizationEngineV1) {
    return NextResponse.json({ error: "Feature disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`roi:broker:${ip}`, { windowMs: 60_000, max: 40 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = estimateBrokerRoi(parsed.data);
  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const uid = await getGuestId();
  await logGrowthEngineAudit({
    actorUserId: uid,
    action: "roi_broker_estimate",
    payload: { netDollars: result.netDollars },
  });
  void trackFunnelEvent("roi_broker_estimate_completed", {});

  return NextResponse.json({ ok: true, result });
}
