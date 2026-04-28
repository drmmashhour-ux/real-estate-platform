/**
 * Aggregate rows written by `@/lib/revenue/stripe-unified-money-capture` (`PlatformRevenueEvent`).
 */

import type { PrismaClient } from "@prisma/client";

export const STRIPE_CAPTURE_ENTITY = "stripe_money_capture";

export type UnifiedStripeCaptureSummary = {
  totalCents30d: number;
  bnhubCents30d: number;
  nonBnhubCents30d: number;
  prev7vsLast7GrowthPercent: number | null;
};

/** Seven-day trailing growth: (recent7 − prior7) ÷ prior7 — null when prior week is zero. */
export async function getUnifiedStripeCaptureSummary(
  prisma: PrismaClient,
  nowInput: Date = new Date(),
): Promise<UnifiedStripeCaptureSummary> {
  const now = new Date(nowInput);
  const thirtyAgo = new Date(now.getTime());
  thirtyAgo.setUTCDate(thirtyAgo.getUTCDate() - 30);

  const last7Start = new Date(now.getTime());
  last7Start.setUTCDate(last7Start.getUTCDate() - 7);
  const prev7Start = new Date(last7Start.getTime());
  prev7Start.setUTCDate(prev7Start.getUTCDate() - 7);

  const [total30, bnhub30, last7, prev7] = await Promise.all([
    prisma.platformRevenueEvent.aggregate({
      where: { entityType: STRIPE_CAPTURE_ENTITY, createdAt: { gte: thirtyAgo, lte: now } },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.aggregate({
      where: {
        entityType: STRIPE_CAPTURE_ENTITY,
        revenueType: { startsWith: "stripe_capture_bnhub" },
        createdAt: { gte: thirtyAgo, lte: now },
      },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.aggregate({
      where: { entityType: STRIPE_CAPTURE_ENTITY, createdAt: { gte: last7Start, lte: now } },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.aggregate({
      where: {
        entityType: STRIPE_CAPTURE_ENTITY,
        createdAt: { gte: prev7Start, lte: last7Start },
      },
      _sum: { amountCents: true },
    }),
  ]);

  const totalCents30d = total30._sum.amountCents ?? 0;
  const bnhubCents30d = bnhub30._sum.amountCents ?? 0;
  const recent7 = last7._sum.amountCents ?? 0;
  const older7 = prev7._sum.amountCents ?? 0;

  let growth: number | null = null;
  if (older7 > 0) {
    growth = ((recent7 - older7) / older7) * 100;
  } else if (recent7 > 0) {
    growth = null;
  }

  return {
    totalCents30d,
    bnhubCents30d,
    nonBnhubCents30d: Math.max(0, totalCents30d - bnhubCents30d),
    prev7vsLast7GrowthPercent: growth,
  };
}
