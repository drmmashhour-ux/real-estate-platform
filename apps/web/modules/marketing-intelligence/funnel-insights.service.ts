import { MarketingSystemEventCategory } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Canonical content → marketplace funnel (zeros until events exist). */
const FLOW: string[] = ["ad_click", "landing_view", "blog_view", "listing_view", "lead_capture", "booking_completed"];

/**
 * Step counts for funnel diagnostics — uses stored FUNNEL events only.
 */
export async function computeFunnelStepCounts(userId: string, since: Date) {
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
  const steps = FLOW.map((key) => ({
    step: key,
    count: byKey[key] ?? 0,
  }));
  const dropoffs: { from: string; to: string; dropPercent: number | null }[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const a = steps[i]!.count;
    const b = steps[i + 1]!.count;
    dropoffs.push({
      from: steps[i]!.step,
      to: steps[i + 1]!.step,
      dropPercent: a > 0 ? Math.round(((a - b) / a) * 1000) / 10 : null,
    });
  }
  const weakest = dropoffs.reduce(
    (worst, d) =>
      d.dropPercent != null && (worst == null || d.dropPercent > (worst.dropPercent ?? -1))
        ? d
        : worst,
    null as (typeof dropoffs)[0] | null,
  );
  return { steps, dropoffs, weakestStep: weakest };
}
