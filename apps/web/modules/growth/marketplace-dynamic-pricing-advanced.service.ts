/**
 * Advanced advisory lead price — combines marketplace balance + conversion with base optimizer.
 * Does not mutate Stripe, catalog, or checkout.
 */

import { getRecommendedLeadPriceCad } from "@/modules/revenue/pricing-optimizer.service";
import { getMarketplaceBalance } from "./marketplace-balance.service";
import { prisma } from "@/lib/db";
import { PRICING_CONFIG } from "@/modules/revenue/pricing-config";

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

export type AdvancedPricingResult = {
  baseRecommendedCad: number;
  recommendedPriceCad: number;
  demandFactor: number;
  conversionFactor: number;
  combinedFactor: number;
  note: string;
  balance: string;
  conversionRate7d: number;
};

/**
 * High broker demand (undersupply) nudges price up; low conversion nudges down. Capped to ±18% on top of base optimizer.
 */
export async function getAdvancedRecommendedLeadPriceCad(): Promise<AdvancedPricingResult> {
  const [base, balanceSnap, conv] = await Promise.all([
    getRecommendedLeadPriceCad(),
    getMarketplaceBalance(),
    getLeadConversionRate7d(),
  ]);

  let demandFactor = 1;
  if (balanceSnap.balance === "undersupply") demandFactor = 1.06;
  if (balanceSnap.balance === "oversupply") demandFactor = 0.97;

  let conversionFactor = 1;
  if (conv < 0.08) conversionFactor = 0.94;
  else if (conv > 0.22) conversionFactor = 1.05;

  const combinedFactor = Math.max(0.82, Math.min(1.18, demandFactor * conversionFactor));
  const [lowBand] = PRICING_CONFIG.canada.lead.low;
  const [, highBand] = PRICING_CONFIG.canada.lead.high;
  let recommended = base.recommendedPrice * combinedFactor;
  recommended = Math.max(lowBand, Math.min(highBand, Math.round(recommended * 100) / 100));

  return {
    baseRecommendedCad: base.recommendedPrice,
    recommendedPriceCad: recommended,
    demandFactor: Math.round((demandFactor - 1) * 1000) / 1000,
    conversionFactor: Math.round((conversionFactor - 1) * 1000) / 1000,
    combinedFactor: Math.round((combinedFactor - 1) * 1000) / 1000,
    balance: balanceSnap.balance,
    conversionRate7d: conv,
    note: `Advanced layer: marketplace=${balanceSnap.balance}, unlock/lead conv≈${(conv * 100).toFixed(1)}% (7d). Confirm before any catalog change.`,
  };
}

async function getLeadConversionRate7d(): Promise<number> {
  const now = new Date();
  const from = addUtcDays(startOfUtcDay(now), -7);
  const to = addUtcDays(startOfUtcDay(now), 1);

  const [gen, unlocked] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.lead.count({
      where: { createdAt: { gte: from, lt: to }, contactUnlockedAt: { not: null } },
    }),
  ]);
  return unlocked / Math.max(1, gen);
}
