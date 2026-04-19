/**
 * Read-only learning rollups from past actions + outcomes — no automation, no execution.
 */

import { prisma } from "@/lib/db";
import type { FlywheelOutcomeScore } from "@/modules/growth/flywheel-action.types";
import type { MarketplaceFlywheelInsightType } from "@/modules/marketplace/flywheel.types";

export type InsightLearningHint = {
  insightType: MarketplaceFlywheelInsightType;
  /** Actions ever created for this insight family */
  similarActionsCount: number;
  /** Actions that reached completed (operator-marked), regardless of outcome */
  completedActionsCount: number;
  /** Share of scored outcomes that were positive / (positive + negative + neutral); excludes insufficient_data */
  successRate: number | null;
  /** Confidence label for operators */
  confidence: "high" | "medium" | "low";
  /** Latest scored outcome explanation if any */
  lastOutcomeExplanation?: string;
  lastOutcomeScore?: FlywheelOutcomeScore;
};

export type ActionTypeLearningRow = {
  actionType: string;
  evaluatedOutcomes: number;
  positiveShare: number | null;
};

export type FlywheelLearningSummary = {
  byInsightType: Partial<Record<MarketplaceFlywheelInsightType, InsightLearningHint>>;
  actionTypeEffectiveness: ActionTypeLearningRow[];
};

function confidenceFromSample(n: number): InsightLearningHint["confidence"] {
  if (n >= 12) return "high";
  if (n >= 5) return "medium";
  return "low";
}

/**
 * Aggregates historical actions/outcomes for evidence strips on insights — deterministic queries only.
 */
export async function summarizeFlywheelLearning(): Promise<FlywheelLearningSummary> {
  const actions = await prisma.marketplaceFlywheelAction.findMany({
    select: {
      id: true,
      insightType: true,
      type: true,
      status: true,
    },
  });

  const outcomes = await prisma.marketplaceFlywheelActionOutcome.findMany({
    include: {
      action: { select: { insightType: true, type: true } },
    },
    orderBy: { measuredAt: "desc" },
    take: 500,
  });

  const insightTypes: MarketplaceFlywheelInsightType[] = [
    "broker_gap",
    "demand_gap",
    "supply_gap",
    "conversion_opportunity",
    "pricing_opportunity",
  ];

  const byInsightType: Partial<Record<MarketplaceFlywheelInsightType, InsightLearningHint>> = {};

  for (const it of insightTypes) {
    const similar = actions.filter((a) => a.insightType === it);
    const completed = similar.filter((a) => a.status === "completed");

    const insightOutcomes = outcomes.filter((o) => o.action.insightType === it);
    const scored = insightOutcomes.filter((o) => o.outcomeScore !== "insufficient_data");
    const positive = scored.filter((o) => o.outcomeScore === "positive").length;
    const negative = scored.filter((o) => o.outcomeScore === "negative").length;
    const neutral = scored.filter((o) => o.outcomeScore === "neutral").length;
    const denom = positive + negative + neutral;

    const latest = insightOutcomes[0];

    byInsightType[it] = {
      insightType: it,
      similarActionsCount: similar.length,
      completedActionsCount: completed.length,
      successRate: denom > 0 ? positive / denom : null,
      confidence: confidenceFromSample(scored.length),
      lastOutcomeExplanation: latest?.explanation,
      lastOutcomeScore: latest ? (latest.outcomeScore as FlywheelOutcomeScore) : undefined,
    };
  }

  const typeKeys = [...new Set(actions.map((a) => a.type))];
  const actionTypeEffectiveness: ActionTypeLearningRow[] = typeKeys.map((actionType) => {
    const relevantOutcomes = outcomes.filter((o) => o.action.type === actionType && o.outcomeScore !== "insufficient_data");
    const pos = relevantOutcomes.filter((o) => o.outcomeScore === "positive").length;
    const neg = relevantOutcomes.filter((o) => o.outcomeScore === "negative").length;
    const neu = relevantOutcomes.filter((o) => o.outcomeScore === "neutral").length;
    const d = pos + neg + neu;
    return {
      actionType,
      evaluatedOutcomes: relevantOutcomes.length,
      positiveShare: d > 0 ? pos / d : null,
    };
  });

  return { byInsightType, actionTypeEffectiveness };
}
