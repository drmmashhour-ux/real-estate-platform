import { prisma } from "@/lib/db";
import { REVENUE_PLATFORM_SCOPE_ID } from "./constants";
import { computeRevenueHealth } from "./compute-revenue-health";
import { getOrCreateRevenueAutopilotSettings } from "./get-revenue-settings";
import { getRevenueLeaks } from "./get-revenue-leaks";
import { getRevenueOpportunities } from "./get-revenue-opportunities";
import { getTopEarners } from "./get-top-earners";
import { getWeakMonetizers } from "./get-weak-monetizers";

export async function getRevenueOverview(input: { scopeType: "owner" | "platform"; scopeId: string }) {
  const scopeId =
    input.scopeType === "platform" ? REVENUE_PLATFORM_SCOPE_ID : input.scopeId;

  const [settings, healthRow, computed] = await Promise.all([
    getOrCreateRevenueAutopilotSettings(input.scopeType, scopeId),
    prisma.revenueHealthScore.findUnique({
      where: { scopeType_scopeId: { scopeType: input.scopeType, scopeId } },
    }),
    computeRevenueHealth({ scopeType: input.scopeType, scopeId }),
  ]);

  const topEarners = getTopEarners(computed.listings);
  const weakMonetizers = getWeakMonetizers(computed.listings);
  const leaks = getRevenueLeaks(computed.listings);
  const opportunities = getRevenueOpportunities(computed.listings);

  const estimatedUpsideCents = opportunities.reduce((s, o) => s + o.estimatedUpliftCents, 0);

  const actions = await prisma.revenueAutopilotAction.findMany({
    where: { scopeType: input.scopeType, scopeId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let portfolioHealthScore: number | null = null;
  if (input.scopeType === "owner") {
    const ph = await prisma.portfolioHealthScore.findUnique({
      where: { ownerUserId: scopeId },
      select: { portfolioHealthScore: true },
    });
    portfolioHealthScore = ph?.portfolioHealthScore ?? null;
  }

  return {
    settings,
    health: {
      revenueScore: computed.revenueScore,
      trendScore: computed.trendScore,
      conversionScore: computed.conversionScore,
      pricingEfficiencyScore: computed.pricingEfficiencyScore,
      portfolioMixScore: computed.portfolioMixScore,
      summary: computed.summary,
      totalRevenueCents90: computed.totalRevenueCents90,
      totalRevenueCentsPrev90: computed.totalRevenueCentsPrev90,
      lastPersistedAt: healthRow?.updatedAt ?? null,
      portfolioHealthScore,
    },
    topEarners,
    weakMonetizers,
    leaks,
    opportunities,
    estimatedUpsideCents,
    actions,
  };
}
