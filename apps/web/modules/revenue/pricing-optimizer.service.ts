/**
 * Advisory default unlock price — bounded adjustments from recent velocity; does not change Stripe or checkout.
 */

import { prisma } from "@/lib/db";
import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";

const LEAD_TYPES = ["lead_unlock", "lead_purchased"] as const;

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type PricingOptimizerResult = {
  anchorCad: number;
  recommendedPrice: number;
  adjustmentPercent: number;
  note: string;
  recentUnlocks: number;
  priorUnlocks: number;
};

/**
 * If recent window sells faster than prior → nudge up; if slower → nudge down. Capped to ±12%.
 */
export async function getRecommendedLeadPriceCad(): Promise<PricingOptimizerResult> {
  const anchorCad = PRICING_CONFIG.canada.lead.default;
  const now = new Date();
  const today = startOfUtcDay(now);
  const tomorrow = addUtcDays(today, 1);
  const recentStart = addUtcDays(today, -7);
  const priorStart = addUtcDays(today, -14);
  const priorEnd = recentStart;

  const [recent, prior] = await Promise.all([
    prisma.revenueEvent.count({
      where: {
        createdAt: { gte: recentStart, lt: tomorrow },
        amount: { gt: 0 },
        eventType: { in: [...LEAD_TYPES] },
      },
    }),
    prisma.revenueEvent.count({
      where: {
        createdAt: { gte: priorStart, lt: priorEnd },
        amount: { gt: 0 },
        eventType: { in: [...LEAD_TYPES] },
      },
    }),
  ]);

  let adjustmentPercent = 0;
  let note = "Velocity flat vs prior 7d — hold default anchor.";

  if (recent === 0 && prior === 0) {
    note = "Insufficient unlock volume — hold default; tune after more conversions.";
  } else if (prior === 0 && recent > 0) {
    adjustmentPercent = 4;
    note = "New unlock activity — small upward nudge within safe band.";
  } else if (prior > 0) {
    const ratio = recent / prior;
    if (ratio >= 1.25) {
      adjustmentPercent = Math.min(12, Math.round((ratio - 1) * 20));
      note = "Unlocks accelerated vs prior week — consider raising default slightly (manual pricing review).";
    } else if (ratio <= 0.75) {
      adjustmentPercent = -Math.min(12, Math.round((1 - ratio) * 20));
      note = "Unlocks slowed vs prior week — consider a modest price ease for conversion (manual review).";
    }
  }

  const factor = 1 + adjustmentPercent / 100;
  const [lowBand] = PRICING_CONFIG.canada.lead.low;
  const [, highBand] = PRICING_CONFIG.canada.lead.high;
  let recommendedPrice = anchorCad * factor;
  recommendedPrice = Math.max(lowBand, Math.min(highBand, Math.round(recommendedPrice * 100) / 100));

  return {
    anchorCad,
    recommendedPrice,
    adjustmentPercent,
    note,
    recentUnlocks: recent,
    priorUnlocks: prior,
  };
}
