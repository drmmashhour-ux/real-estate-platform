/**
 * Weekly strategy loop — pulls titles from strategy bundle + executive; advisory only.
 */

import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import type { GrowthLearningSummary } from "./growth-learning.types";
import type { GrowthStrategyBundle } from "./growth-strategy.types";
import type { GrowthWeeklyCadence } from "./growth-cadence.types";

export type GrowthWeeklyCadenceInput = {
  strategyBundle: GrowthStrategyBundle | null;
  executive: GrowthExecutiveSummary | null;
  learningSummary: GrowthLearningSummary | null;
  governance: GrowthGovernanceDecision | null;
  learningControl: GrowthLearningControlDecision | null;
};

function weekStartIsoUtc(d = new Date()): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  return utc.toISOString().slice(0, 10);
}

export function buildGrowthWeeklyCadence(input: GrowthWeeklyCadenceInput): GrowthWeeklyCadence {
  const createdAt = new Date().toISOString();
  const weekStart = weekStartIsoUtc();

  const plan = input.strategyBundle?.weeklyPlan;
  const strategyFocus =
    plan?.topPriority?.trim() ||
    input.executive?.topPriority?.trim() ||
    "Align acquisition, conversion, and governance before scaling experiments.";

  const priorities: string[] = [];
  if (plan?.priorities?.length) {
    for (const p of plan.priorities.slice(0, 5)) {
      if (p.title?.trim()) priorities.push(p.title.trim());
    }
  } else if (input.executive?.topPriorities?.length) {
    for (const p of input.executive.topPriorities.slice(0, 5)) {
      if (p.title?.trim()) priorities.push(p.title.trim());
    }
  }

  const experiments: string[] = [];
  if (plan?.experiments?.length) {
    for (const e of plan.experiments.slice(0, 3)) {
      if (e.title?.trim()) experiments.push(e.title.trim());
    }
  }

  const roadmapFocus: string[] = [];
  const road = input.strategyBundle?.roadmapSummary?.length
    ? input.strategyBundle.roadmapSummary
    : plan?.roadmap ?? [];
  for (const r of road.slice(0, 3)) {
    if (r.title?.trim()) roadmapFocus.push(`${r.horizon}: ${r.title.trim()}`);
  }

  const warnings: string[] = [];
  if (input.governance?.status === "freeze_recommended" || input.governance?.status === "human_review_required") {
    warnings.push("Governance escalation — do not scale automated or paid experiments until reviewed.");
  }
  if (input.learningControl?.state === "reset_recommended") {
    warnings.push("Learning control suggests reset review — avoid aggressive optimization this week.");
  }
  for (const w of input.learningSummary?.warnings?.slice(0, 2) ?? []) {
    warnings.push(w);
  }
  if (input.executive?.campaignSummary.adsPerformance === "WEAK") {
    warnings.push("Executive band: weak campaign performance — prioritize conversion learning over reach.");
  }

  return {
    weekStart,
    strategyFocus,
    priorities: priorities.slice(0, 5),
    experiments: experiments.slice(0, 3),
    roadmapFocus: roadmapFocus.slice(0, 3),
    warnings: warnings.slice(0, 6),
    createdAt,
  };
}
