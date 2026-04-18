/**
 * Funnel visualization — aggregates FUNNEL category events into step counts + drop-offs.
 */
import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Soft launch measurement path (blog optional — use default insights for blog-heavy flows). */
export const SOFT_LAUNCH_FUNNEL_FLOW = [
  "ad_click",
  "landing_view",
  "cta_click",
  "listing_view",
  "lead_capture",
  "booking_completed",
] as const;

export type FunnelVisualizationResult = {
  steps: { step: string; count: number }[];
  dropOffRates: { from: string; to: string; dropPercent: number | null }[];
  /** Last step count / first step count — null if no traffic at top. */
  conversionRate: number | null;
};

export async function computeFunnelVisualization(
  userId: string,
  since: Date,
  flow: readonly string[]
): Promise<FunnelVisualizationResult> {
  const rows = await prisma.marketingSystemEvent.groupBy({
    by: ["eventKey"],
    where: {
      userId,
      category: MarketingSystemEventCategory.FUNNEL,
      createdAt: { gte: since },
    },
    _count: { _all: true },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.eventKey, r._count._all]));
  const steps = flow.map((key) => ({
    step: key,
    count: byKey[key] ?? 0,
  }));

  const dropOffRates: { from: string; to: string; dropPercent: number | null }[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i]!.count;
    const b = steps[i + 1]!.count;
    dropOffRates.push({
      from: steps[i]!.step,
      to: steps[i + 1]!.step,
      dropPercent: a > 0 ? Math.round(((a - b) / a) * 1000) / 10 : null,
    });
  }

  const first = steps[0]?.count ?? 0;
  const last = steps.length > 0 ? steps[steps.length - 1]!.count : 0;
  const conversionRate = first > 0 ? Math.round((last / first) * 10000) / 10000 : null;

  return { steps, dropOffRates, conversionRate };
}
