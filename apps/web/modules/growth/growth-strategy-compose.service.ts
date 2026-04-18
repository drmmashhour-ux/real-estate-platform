/**
 * Pure strategy composition — no I/O (used by aggregator and unit tests).
 */

import { buildGrowthStrategyExperiments } from "./growth-strategy-experiments.service";
import { buildGrowthStrategyPriorities } from "./growth-strategy-priority.service";
import { buildGrowthStrategyRoadmap } from "./growth-strategy-roadmap.service";
import { deriveGrowthStrategyStatus } from "./growth-strategy-status.util";
import type {
  GrowthStrategyBundle,
  GrowthStrategyPlan,
  GrowthStrategySourceSnapshot,
} from "./growth-strategy.types";

export function collectBlockers(snapshot: GrowthStrategySourceSnapshot): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };
  for (const w of snapshot.missingDataWarnings) push(`Data: ${w}`);
  if (snapshot.dailyBrief?.blockers?.length) {
    for (const b of snapshot.dailyBrief.blockers.slice(0, 4)) push(b);
  }
  if (snapshot.governance?.topRisks?.length) {
    for (const r of snapshot.governance.topRisks.slice(0, 2)) {
      push(`[${r.category}] ${r.title}`);
    }
  }
  return out.slice(0, 12);
}

export function collectNotes(snapshot: GrowthStrategySourceSnapshot): string[] {
  const notes: string[] = [];
  if (snapshot.fusionSummary?.topOpportunities?.length) {
    notes.push(`Fusion opportunities: ${snapshot.fusionSummary.topOpportunities.slice(0, 2).join("; ")}`);
  }
  if (snapshot.dailyBrief?.notes?.length) {
    notes.push(...snapshot.dailyBrief.notes.slice(0, 2));
  }
  if (snapshot.coordination?.notes?.length) {
    notes.push(...snapshot.coordination.notes.slice(0, 2));
  }
  return notes.slice(0, 8);
}

export function composeGrowthStrategyBundleFromSnapshot(
  snapshot: GrowthStrategySourceSnapshot,
  options: { experimentsEnabled: boolean; roadmapEnabled: boolean },
): GrowthStrategyBundle {
  const priorities = buildGrowthStrategyPriorities(snapshot);
  const experimentsRaw = options.experimentsEnabled ? buildGrowthStrategyExperiments(snapshot) : [];
  const roadmapRaw = options.roadmapEnabled ? buildGrowthStrategyRoadmap(snapshot) : [];

  const blockers = collectBlockers(snapshot);
  const notes = collectNotes(snapshot);

  const governanceRiskHigh =
    snapshot.governance?.topRisks.some((r) => r.severity === "high") ?? false;
  const governanceHumanReview =
    snapshot.governance?.status === "human_review_required" ||
    (snapshot.governance?.humanReviewItems?.length ?? 0) > 0;
  const governanceFreeze = snapshot.governance?.status === "freeze_recommended";
  const executiveWeak = snapshot.executive?.status === "weak";
  const executiveStrong = snapshot.executive?.status === "strong";
  const acquisitionWeak = snapshot.adsHealth === "WEAK";
  const fusionWeak = snapshot.fusionSummary?.status === "weak";
  const strongCampaignAndLeads =
    snapshot.adsHealth === "STRONG" &&
    (snapshot.executive?.leadSummary.hotLeads ?? 0) >= 1 &&
    (snapshot.governance?.status === "healthy" || snapshot.governance == null);
  const missingDataHeavy = snapshot.missingDataWarnings.length >= 3;

  const status = deriveGrowthStrategyStatus({
    governanceRiskHigh,
    governanceHumanReview,
    governanceFreeze,
    blockerCount: blockers.length,
    executiveWeak,
    executiveStrong,
    acquisitionWeak,
    fusionWeak,
    strongCampaignAndLeads,
    missingDataHeavy,
  });

  const createdAt = new Date().toISOString();
  const topPriority = priorities[0]?.title;

  const weeklyPlan: GrowthStrategyPlan = {
    horizon: "this_week",
    status,
    topPriority,
    priorities,
    experiments: experimentsRaw,
    roadmap: roadmapRaw,
    blockers,
    notes,
    createdAt,
  };

  return {
    weeklyPlan,
    roadmapSummary: options.roadmapEnabled ? roadmapRaw.slice(0, 6) : [],
    createdAt,
  };
}
