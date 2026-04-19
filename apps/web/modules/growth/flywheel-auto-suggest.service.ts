/**
 * Builds ranked growth action suggestions — never creates MarketplaceFlywheelAction rows automatically.
 * Rankings combine current flywheel flags with past **scored** operator outcomes: descriptive association only,
 * not proof that an action type caused marketplace movement. Outputs stay internal / advisory.
 */

import type { MarketplaceFlywheelInsight } from "@/modules/marketplace/flywheel.types";
import { prioritizeFlywheelInsights } from "@/modules/marketplace/flywheel.service";
import type { FlywheelLearningSummary } from "@/modules/growth/flywheel-learning.service";
import type {
  GrowthActionSuggestion,
  GrowthActionSuggestionBundle,
  GrowthActionSuccessProfile,
} from "@/modules/growth/flywheel-success-suggestions.types";
import {
  computeRankScore,
  insightToDefaultActionType,
  type RankableSuggestionSeed,
} from "@/modules/growth/flywheel-auto-suggest-rules.service";
import {
  monitorFlywheelAutoSuggestBundleBuilt,
  monitorFlywheelAutoSuggestLowConfidence,
} from "@/modules/growth/flywheel-auto-suggest-monitoring.service";

const MAX_SUGGESTIONS = 5;

const TITLE: Record<string, string> = {
  broker_acquisition: "Broker bench / routing capacity",
  demand_generation: "Top-of-funnel demand",
  supply_growth: "Listing / seller-side supply",
  conversion_fix: "Unlock & funnel conversion hygiene",
  pricing_adjustment: "Advisory monetization review",
};

const OWNER_BY_ACTION: Record<string, GrowthActionSuggestion["ownerArea"]> = {
  broker_acquisition: "broker_success",
  demand_generation: "growth_ops",
  supply_growth: "growth_ops",
  conversion_fix: "product",
  pricing_adjustment: "monetization",
};

function describeAction(t: string): string {
  return (
    TITLE[t] ??
    `Tracked flywheel action type “${t}” — compare against measured outcomes before committing effort.`
  );
}

function suggestionFromSeed(
  seed: RankableSuggestionSeed,
  idx: number,
): GrowthActionSuggestion {
  const profile = seed.profile;
  const sr = profile?.successRate ?? null;
  const conf = profile?.confidenceLevel ?? "low";
  const insight = seed.insight;

  const scoredEvalCount = profile
    ? profile.positiveCount + profile.neutralCount + profile.negativeCount
    : 0;

  const constraints = [
    "No automatic campaigns, budgets, or flywheel action rows — operators create actions explicitly.",
    "Confirm against live CRM/market reality before prioritizing.",
    "Past outcome scores describe co-occurrence in admin data — they do not prove this action type caused results.",
  ];
  if (conf === "low") constraints.push("Historical scored sample is small or noisy — treat any rate as directional only.");
  if (profile && scoredEvalCount > 0 && scoredEvalCount < 5) {
    constraints.push(
      `Only ${scoredEvalCount} scored evaluation(s) for this action type — sparse data; do not treat share as stable.`,
    );
  }

  const recommendedNow =
    computeRankScore(seed) > 200 &&
    (insight?.impact === "high" || (sr != null && sr >= 0.45 && conf !== "low"));

  let rationale =
    "Ordered for internal review by combining current flywheel priorities with historically scored outcome tags per action family. This is a triage ranking, not validation that any action worked.";
  if (sr != null) {
    rationale += ` Among past scored evaluations for this action type, about ${Math.round(sr * 100)}% were tagged positive — a coarse internal fraction, not a forecast of success.`;
  } else {
    rationale +=
      " Little comparable scored history for this action type; ordering leans on current insight emphasis and should be treated as weak evidence.";
  }
  if (profile?.notes[0]) rationale += ` ${profile.notes[0]}`;

  if (conf === "low" && recommendedNow) {
    monitorFlywheelAutoSuggestLowConfidence({ suggestionId: `sug-${idx}` });
  }

  return {
    id: `sug-${seed.actionType}-${idx}`,
    actionType: seed.actionType,
    title: TITLE[seed.actionType] ?? describeAction(seed.actionType),
    description: describeAction(seed.actionType),
    successRate: sr,
    confidenceLevel: conf,
    recommendedNow,
    rationale,
    constraints,
    relatedInsightType: seed.relatedInsightType,
    ownerArea: OWNER_BY_ACTION[seed.actionType] ?? "growth_ops",
  };
}

export function buildAutoSuggestedGrowthActions(input: {
  prioritizedInsights: MarketplaceFlywheelInsight[];
  learning: FlywheelLearningSummary;
  profiles: GrowthActionSuccessProfile[];
}): GrowthActionSuggestionBundle {
  const warnings: string[] = [
    "Advisory / internal only — rankings do not establish causal proof and must not drive public pricing or automated execution.",
  ];
  if (input.prioritizedInsights.length === 0) {
    warnings.push("No current flywheel flags — any fill-ins below are weak baselines, not recommendations with evidence.");
  }
  if (input.profiles.length === 0) {
    warnings.push("No historical flywheel outcome aggregates — everything below is extremely low-evidence.");
  }
  if (input.profiles.some((p) => p.confidenceLevel === "low")) {
    warnings.push("At least one action type has a thin scored history — prefer explicit sample sizes on each card over headline rates.");
  }

  const profileByType = new Map(input.profiles.map((p) => [p.actionType, p]));
  const seeds: RankableSuggestionSeed[] = [];
  let p = 10;
  for (const ins of input.prioritizedInsights) {
    const at = insightToDefaultActionType(ins.type);
    seeds.push({
      actionType: at,
      relatedInsightType: ins.type,
      insight: ins,
      profile: profileByType.get(at),
      insightLearning: input.learning.byInsightType[ins.type],
      priorityScore: p,
    });
    p -= 1;
  }

  for (const pr of input.profiles) {
    if (seeds.some((s) => s.actionType === pr.actionType)) continue;
    if (pr.positiveCount + pr.neutralCount + pr.negativeCount === 0) continue;
    seeds.push({
      actionType: pr.actionType,
      relatedInsightType: null,
      profile: pr,
      priorityScore: 1,
    });
  }

  const sorted = [...seeds].sort((a, b) => computeRankScore(b) - computeRankScore(a));
  const top = sorted.slice(0, MAX_SUGGESTIONS);
  const suggestions = top.map((s, i) => suggestionFromSeed(s, i));

  const lowConf = suggestions.filter((s) => s.confidenceLevel === "low" && s.recommendedNow).length;
  monitorFlywheelAutoSuggestBundleBuilt({
    suggestionCount: suggestions.length,
    lowConfidenceCount: lowConf,
    topCategories: suggestions.map((s) => s.actionType),
  });

  return {
    suggestions,
    generatedAt: new Date().toISOString(),
    warnings,
  };
}

export async function buildAutoSuggestBundleFromData(
  load: () => Promise<{
    insights: MarketplaceFlywheelInsight[];
    learning: FlywheelLearningSummary;
    profiles: GrowthActionSuccessProfile[];
  }>,
): Promise<GrowthActionSuggestionBundle> {
  const { insights, learning, profiles } = await load();
  const prioritized = prioritizeFlywheelInsights(insights);
  return buildAutoSuggestedGrowthActions({ prioritizedInsights: prioritized, learning, profiles });
}
