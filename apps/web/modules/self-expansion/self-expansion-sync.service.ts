import { prisma } from "@/lib/db";
import {
  buildExpansionRecommendationSet,
} from "@/modules/self-expansion/self-expansion.engine";
import { selfExpansionLog } from "@/modules/self-expansion/self-expansion-log";
import type { SelfExpansionRecommendationDraft } from "@/modules/self-expansion/self-expansion.types";

export async function upsertExpansionDraft(d: SelfExpansionRecommendationDraft): Promise<void> {
  const existing = await prisma.lecipmSelfExpansionRecommendation.findUnique({
    where: { fingerprint: d.fingerprint },
  });

  const payload = {
    territoryId: d.territoryId,
    title: d.title,
    category: d.category,
    summary: d.summary,
    expansionScore: d.expansionScore,
    confidenceScore: d.confidenceScore,
    urgency: d.urgency,
    expectedImpactBand: d.expectedImpactBand,
    requiredEffort: d.requiredEffort,
    entryHub: d.entryHub,
    targetSegment: d.targetSegment,
    phaseSuggested: d.phaseSuggested,
    recommendationActionBand: d.recommendationActionBand,
    executionSafety: d.executionSafety,
    phasedPlanSummary: d.phasedPlanSummary,
    explanationJson: d.explanation as unknown as object,
    signalsSnapshotJson: d.signalsUsed as unknown as object,
    inputSnapshotJson: d.inputSnapshot as object,
    firstActionsJson: d.firstActions as unknown as object,
    expectedRisksJson: d.expectedRisks as unknown as object,
    lastRefreshedAt: new Date(),
  };

  if (!existing) {
    await prisma.lecipmSelfExpansionRecommendation.create({
      data: {
        fingerprint: d.fingerprint,
        ...payload,
        decisionStatus: "PROPOSED",
      },
    });
    return;
  }

  if (existing.decisionStatus === "PROPOSED") {
    await prisma.lecipmSelfExpansionRecommendation.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.lecipmSelfExpansionRecommendation.update({
      where: { id: existing.id },
      data: { lastRefreshedAt: new Date() },
    });
  }
}

export async function syncSelfExpansionRecommendationsFromEngine(): Promise<
  Awaited<ReturnType<typeof buildExpansionRecommendationSet>>
> {
  const bundle = await buildExpansionRecommendationSet();
  for (const d of bundle.recommendations) {
    await upsertExpansionDraft(d);
  }
  selfExpansionLog("info", "sync_complete", { n: bundle.recommendations.length });
  return bundle;
}
