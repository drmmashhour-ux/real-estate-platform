import { prisma } from "@/lib/db";
import { buildCeoContext, buildPrioritizedRecommendations } from "@/modules/ai-ceo/ai-ceo.engine";
import { aiCeoLog } from "@/modules/ai-ceo/ai-ceo-log";
import type { AiCeoPrioritizedSet, AiCeoRecommendationDraft } from "@/modules/ai-ceo/ai-ceo.types";

function flattenPrioritized(set: AiCeoPrioritizedSet): AiCeoRecommendationDraft[] {
  return [...set.topPriorities, ...set.quickWins, ...set.highRiskHighReward, ...set.lowValue];
}

export async function upsertRecommendationDraft(d: AiCeoRecommendationDraft): Promise<void> {
  const existing = await prisma.lecipmAiCeoRecommendation.findUnique({
    where: { fingerprint: d.fingerprint },
  });

  const payload = {
    title: d.title,
    category: d.category,
    summary: d.summary,
    expectedImpactBand: d.expectedImpactBand,
    confidenceScore: d.confidenceScore,
    urgency: d.urgency,
    requiredEffort: d.requiredEffort,
    affectedDomains: d.affectedDomains as unknown as object,
    explanationJson: d.explanation as unknown as object,
    signalsSnapshotJson: d.signalsUsed as unknown as object,
    inputSnapshotJson: d.inputSnapshot as object,
    executionSafety: d.executionSafety,
    prioritizationBucket: d.prioritizationBucket ?? null,
    lastRefreshedAt: new Date(),
  };

  if (!existing) {
    await prisma.lecipmAiCeoRecommendation.create({
      data: {
        fingerprint: d.fingerprint,
        ...payload,
        decisionStatus: "pending",
      },
    });
    return;
  }

  if (existing.decisionStatus === "pending") {
    await prisma.lecipmAiCeoRecommendation.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.lecipmAiCeoRecommendation.update({
      where: { id: existing.id },
      data: { lastRefreshedAt: new Date() },
    });
  }
}

/** Rebuilds strategic set from live signals and merges into audit table (pending rows refresh in full). */
export async function syncAiCeoRecommendationsFromEngine(): Promise<{
  context: Awaited<ReturnType<typeof buildCeoContext>>;
  prioritized: AiCeoPrioritizedSet;
}> {
  const context = await buildCeoContext();
  const prioritized = buildPrioritizedRecommendations(context);
  const flat = flattenPrioritized(prioritized);

  for (const d of flat) {
    await upsertRecommendationDraft(d);
  }

  aiCeoLog("info", "sync_complete", { recommendations: flat.length });
  return { context, prioritized };
}
