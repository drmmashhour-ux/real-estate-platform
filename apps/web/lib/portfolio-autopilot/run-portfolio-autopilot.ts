import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { computePortfolioHealth, upsertPortfolioHealthRecord } from "./compute-portfolio-health";
import { generatePortfolioActions } from "./generate-portfolio-actions";
import { getOpportunities } from "./get-opportunities";
import { getTopPerformers } from "./get-top-performers";
import { getWeakPerformers } from "./get-weak-performers";
import { getOrCreatePortfolioAutopilotSettings } from "./get-portfolio-settings";
import { logPortfolioAutopilotEvent } from "./log-portfolio-event";
import { applySafePortfolioActions } from "./apply-safe-portfolio-actions";
import { portfolioSafeAutoRunEnabled } from "./validators";

export async function runPortfolioAutopilot(input: {
  ownerUserId: string;
  performedByUserId: string | null;
}) {
  const settings = await getOrCreatePortfolioAutopilotSettings(input.ownerUserId);
  if (settings.mode === "off") {
    throw new Error("Portfolio autopilot is off");
  }

  const health = await computePortfolioHealth(input.ownerUserId);
  await upsertPortfolioHealthRecord(input.ownerUserId, {
    portfolioHealthScore: health.portfolioHealthScore,
    revenueHealth: health.revenueHealth,
    qualityHealth: health.qualityHealth,
    performanceHealth: health.performanceHealth,
    behaviorHealth: health.behaviorHealth,
    trustHealth: health.trustHealth,
    summary: health.summary,
  });

  const top = getTopPerformers(health.listings);
  const weak = getWeakPerformers(health.listings);
  const opportunities = getOpportunities(health.listings);

  await prisma.portfolioAutopilotAction.deleteMany({
    where: { ownerUserId: input.ownerUserId, status: "suggested" },
  });

  const generated = await generatePortfolioActions({
    ownerUserId: input.ownerUserId,
    weak,
    top,
    opportunities,
  });

  if (generated.length > 0) {
    await prisma.portfolioAutopilotAction.createMany({
      data: generated.map((g) => ({
        ownerUserId: input.ownerUserId,
        actionType: g.actionType,
        title: g.title,
        description: g.description,
        priority: g.priority,
        metadataJson: asInputJsonValue(g.metadataJson),
      })),
    });
  }

  await logPortfolioAutopilotEvent({
    ownerUserId: input.ownerUserId,
    actionType: "portfolio_autopilot_run",
    performedByUserId: input.performedByUserId,
    outputPayload: {
      portfolioHealthScore: health.portfolioHealthScore,
      actionsCreated: generated.length,
      listingCount: health.listingCount,
    },
    explanation: health.summary,
  });

  if (portfolioSafeAutoRunEnabled(settings.mode)) {
    await applySafePortfolioActions({
      ownerUserId: input.ownerUserId,
      performedByUserId: input.performedByUserId,
    });
  }

  return {
    portfolioHealthScore: health.portfolioHealthScore,
    summary: health.summary,
    revenue90dCents: health.revenue90dCents,
    listingCount: health.listingCount,
    top,
    weak,
    opportunities,
    actionsCreated: generated.length,
  };
}
