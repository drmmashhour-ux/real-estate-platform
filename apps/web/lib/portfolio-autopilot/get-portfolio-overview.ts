import { prisma } from "@/lib/db";
import { computePortfolioHealth } from "./compute-portfolio-health";
import { getOpportunities } from "./get-opportunities";
import { getTopPerformers } from "./get-top-performers";
import { getWeakPerformers } from "./get-weak-performers";
import { getOrCreatePortfolioAutopilotSettings } from "./get-portfolio-settings";

export async function getPortfolioOverview(ownerUserId: string) {
  const [settings, computed, lastPersisted, actions] = await Promise.all([
    getOrCreatePortfolioAutopilotSettings(ownerUserId),
    computePortfolioHealth(ownerUserId),
    prisma.portfolioHealthScore.findUnique({ where: { ownerUserId } }),
    prisma.portfolioAutopilotAction.findMany({
      where: { ownerUserId },
      orderBy: [{ createdAt: "desc" }],
      take: 40,
    }),
  ]);

  const top = getTopPerformers(computed.listings);
  const weak = getWeakPerformers(computed.listings);
  const opportunities = getOpportunities(computed.listings);

  return {
    settings,
    health: {
      portfolioHealthScore: computed.portfolioHealthScore,
      revenueHealth: computed.revenueHealth,
      qualityHealth: computed.qualityHealth,
      performanceHealth: computed.performanceHealth,
      behaviorHealth: computed.behaviorHealth,
      trustHealth: computed.trustHealth,
      summary: computed.summary,
      revenue90dCents: computed.revenue90dCents,
      listingCount: computed.listingCount,
      lastPersistedAt: lastPersisted?.updatedAt ?? null,
    },
    top,
    weak,
    opportunities,
    actions,
  };
}
