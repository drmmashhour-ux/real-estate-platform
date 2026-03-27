/**
 * Minimal aggregates for client-side UX adaptation (cached; same DB as admin insights).
 */
import { unstable_cache } from "next/cache";
import { UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export type ProductInsightsClientSnapshot = {
  /** InvestmentDeal ÷ ANALYZE events (%) */
  analyzeToSaveRate: number | null;
  /** SAVE_DEAL ÷ ANALYZE events (%) */
  eventFunnelConversionPct: number | null;
  avgDealsPerUser: number;
  totalUsers: number;
  analyzeEvents: number;
  saveEvents: number;
  compareEvents: number;
  /** True when analyze volume is enough and Compare is underused */
  compareUsageLow: boolean;
};

async function computeMinimalProductInsights(): Promise<ProductInsightsClientSnapshot> {
  const [totalUsers, analyzeEvents, saveEvents, compareEvents, totalSavedDeals] = await Promise.all([
    prisma.user.count(),
    prisma.userEvent.count({ where: { eventType: UserEventType.ANALYZE } }),
    prisma.userEvent.count({ where: { eventType: UserEventType.SAVE_DEAL } }),
    prisma.userEvent.count({ where: { eventType: UserEventType.COMPARE } }),
    prisma.investmentDeal.count(),
  ]);

  const analyzeToSaveRate =
    analyzeEvents > 0 ? round1((totalSavedDeals / analyzeEvents) * 100) : null;
  const eventFunnelConversionPct =
    analyzeEvents > 0 ? round1((saveEvents / analyzeEvents) * 100) : null;
  const avgDealsPerUser = totalUsers > 0 ? round1(totalSavedDeals / totalUsers) : 0;

  const compareUsageLow = analyzeEvents >= 5 && compareEvents / analyzeEvents < 0.15;

  return {
    analyzeToSaveRate,
    eventFunnelConversionPct,
    avgDealsPerUser,
    totalUsers,
    analyzeEvents,
    saveEvents,
    compareEvents,
    compareUsageLow,
  };
}

/** 5-minute server cache — shared across all clients hitting the API */
export const getCachedMinimalProductInsights = unstable_cache(
  computeMinimalProductInsights,
  ["product-insights-minimal-v1"],
  { revalidate: 300 }
);
