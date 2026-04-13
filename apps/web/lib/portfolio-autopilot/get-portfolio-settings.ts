import type { PortfolioAutopilotMode } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreatePortfolioAutopilotSettings(ownerUserId: string) {
  return prisma.portfolioAutopilotSetting.upsert({
    where: { ownerUserId },
    create: { ownerUserId },
    update: {},
  });
}

export async function updatePortfolioAutopilotSettings(
  ownerUserId: string,
  data: Partial<{
    mode: PortfolioAutopilotMode;
    autoRunListingOptimization: boolean;
    autoGenerateContentForTopListings: boolean;
    autoFlagWeakListings: boolean;
    allowPriceRecommendations: boolean;
  }>
) {
  await getOrCreatePortfolioAutopilotSettings(ownerUserId);
  return prisma.portfolioAutopilotSetting.update({
    where: { ownerUserId },
    data,
  });
}
