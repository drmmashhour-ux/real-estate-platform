/**
 * Marketplace supply/demand signals — read-only; no ranking or allocation changes.
 */

import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

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

export type MarketplaceBalance = "oversupply" | "balanced" | "undersupply";

export type MarketplaceBalanceSnapshot = {
  leadsLast7d: number;
  activeBrokers: number;
  /** Leads per active broker (rolling 7d) */
  leadsPerBroker: number;
  balance: MarketplaceBalance;
  recommendations: string[];
};

/** Heuristic thresholds — advisory only */
const OVERSUPPLY_LEADS_PER_BROKER = 14;
const UNDERSUPPLY_LEADS_PER_BROKER = 2.5;

export async function getMarketplaceBalance(): Promise<MarketplaceBalanceSnapshot> {
  const now = new Date();
  const from = addUtcDays(startOfUtcDay(now), -7);
  const to = addUtcDays(startOfUtcDay(now), 1);

  const [leadsLast7d, activeBrokers] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.user.count({
      where: { role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
    }),
  ]);

  const denom = Math.max(1, activeBrokers);
  const leadsPerBroker = Math.round((leadsLast7d / denom) * 100) / 100;

  let balance: MarketplaceBalance = "balanced";
  const recommendations: string[] = [];

  if (leadsPerBroker > OVERSUPPLY_LEADS_PER_BROKER) {
    balance = "oversupply";
    recommendations.push("Increase broker acquisition — intake is high relative to active broker coverage.");
    recommendations.push("Tune routing quality and broker onboarding to absorb demand without burning leads.");
  } else if (leadsPerBroker < UNDERSUPPLY_LEADS_PER_BROKER) {
    balance = "undersupply";
    recommendations.push("Increase top-of-funnel acquisition — paid + organic + partnerships (/get-leads, campaigns).");
    recommendations.push("Protect conversion: review CRO on landing and unlock friction.");
  } else {
    recommendations.push("Maintain rhythm — balance looks within band; monitor weekly.");
  }

  return {
    leadsLast7d,
    activeBrokers,
    leadsPerBroker,
    balance,
    recommendations,
  };
}
