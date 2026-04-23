import { NextResponse } from "next/server";
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { requireUser } from "@/modules/security/access-guard.service";
import { aggregatePerformanceForUser } from "@/modules/marketing-performance";
import { computeFunnelStepCounts } from "@/modules/marketing-intelligence/funnel-insights.service";
import { optimizeCampaign } from "@/modules/marketing-intelligence/campaign-optimizer.service";

export const dynamic = "force-dynamic";

/** Explainable optimization hints from stored performance + funnel (no auto-apply). */
export async function GET() {
  if (!engineFlags.marketingIntelligenceV1) {
    return NextResponse.json({ error: "Marketing intelligence is disabled" }, { status: 403 });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const [agg, funnel, leadCount, bookingCount] = await Promise.all([
    aggregatePerformanceForUser(auth.userId, since),
    computeFunnelStepCounts(auth.userId, since),
    prisma.marketingSystemEvent.count({
      where: {
        userId: auth.userId,
        category: MarketingSystemEventCategory.PERFORMANCE,
        eventKey: "lead",
        createdAt: { gte: since },
      },
    }),
    prisma.marketingSystemEvent.count({
      where: {
        userId: auth.userId,
        category: MarketingSystemEventCategory.PERFORMANCE,
        eventKey: "booking",
        createdAt: { gte: since },
      },
    }),
  ]);

  const revenueCents = agg.amountByKey["revenue"] ?? 0;
  const spendCents = agg.amountByKey["spend"] ?? 0;
  const weakest = funnel.weakestStep
    ? { from: funnel.weakestStep.from, to: funnel.weakestStep.to }
    : null;

  const result = optimizeCampaign({
    revenueCents,
    spendCents,
    leadCount,
    bookingCount,
    weakestFunnelStep: weakest,
    impressions: agg.impressions,
    clicks: agg.clicks,
  });

  return NextResponse.json({
    windowDays: 90,
    inputs: {
      revenueCents,
      spendCents,
      leadCount,
      bookingCount,
      impressions: agg.impressions,
      clicks: agg.clicks,
      weakestFunnelStep: weakest,
    },
    ...result,
  });
}
