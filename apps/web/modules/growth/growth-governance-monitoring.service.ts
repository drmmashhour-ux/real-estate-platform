/**
 * Governance observability — gated by FEATURE_GROWTH_GOVERNANCE_MONITORING_V1.
 * Never throws; never blocks callers.
 */

import { growthGovernanceFlags } from "@/config/feature-flags";
import type { GrowthGovernanceDecision, GrowthGovernanceStatus } from "./growth-governance.types";

export type GrowthGovernanceMonitoringSnapshot = {
  evaluationsCount: number;
  healthyCount: number;
  watchCount: number;
  cautionCount: number;
  freezeRecommendedCount: number;
  humanReviewRequiredCount: number;
  repeatedEscalationCount: number;
  missingSignalWarnings: number;
};

/** @deprecated Prefer GrowthGovernanceMonitoringSnapshot */
export type GrowthGovernanceMonitoringCounters = GrowthGovernanceMonitoringSnapshot;

const counters: GrowthGovernanceMonitoringSnapshot = {
  evaluationsCount: 0,
  healthyCount: 0,
  watchCount: 0,
  cautionCount: 0,
  freezeRecommendedCount: 0,
  humanReviewRequiredCount: 0,
  repeatedEscalationCount: 0,
  missingSignalWarnings: 0,
};

let lastStatus: GrowthGovernanceStatus | null = null;

export function getGrowthGovernanceMonitoringSnapshot(): GrowthGovernanceMonitoringSnapshot {
  return { ...counters };
}

/** Alias for `getGrowthGovernanceMonitoringSnapshot`. */
export function getGrowthGovernanceMonitoringCounters(): GrowthGovernanceMonitoringSnapshot {
  return getGrowthGovernanceMonitoringSnapshot();
}

export function resetGrowthGovernanceMonitoringForTests(): void {
  counters.evaluationsCount = 0;
  counters.healthyCount = 0;
  counters.watchCount = 0;
  counters.cautionCount = 0;
  counters.freezeRecommendedCount = 0;
  counters.humanReviewRequiredCount = 0;
  counters.repeatedEscalationCount = 0;
  counters.missingSignalWarnings = 0;
  lastStatus = null;
}

function bumpStatus(status: GrowthGovernanceStatus): void {
  if (status === "healthy") counters.healthyCount += 1;
  else if (status === "watch") counters.watchCount += 1;
  else if (status === "caution") counters.cautionCount += 1;
  else if (status === "freeze_recommended") counters.freezeRecommendedCount += 1;
  else counters.humanReviewRequiredCount += 1;
}

export function logGrowthGovernanceEvaluationStarted(): void {
  try {
    if (!growthGovernanceFlags.growthGovernanceMonitoringV1) return;
    console.info("[growth:governance] evaluation started");
  } catch {
    /* never throw */
  }
}

export function recordGrowthGovernanceEvaluation(input: {
  decision: GrowthGovernanceDecision;
  governanceWarnings: string[];
  reviewQueueSize: number;
  blockedCount: number;
  frozenCount: number;
}): void {
  try {
    if (!growthGovernanceFlags.growthGovernanceMonitoringV1) return;

    const { decision, governanceWarnings, reviewQueueSize, blockedCount, frozenCount } = input;
    counters.evaluationsCount += 1;
    bumpStatus(decision.status);

    if (governanceWarnings.length > 0) {
      counters.missingSignalWarnings += governanceWarnings.length;
    }

    if (
      lastStatus === "human_review_required" &&
      decision.status === "human_review_required"
    ) {
      counters.repeatedEscalationCount += 1;
    }
    lastStatus = decision.status;

    const topRiskCount = decision.topRisks.length;
    console.info(
      `[growth:governance] evaluation completed status=${decision.status} topRisks=${topRiskCount} blockedDomains=${blockedCount} frozenDomainsHint=${frozenCount} reviewItems=${reviewQueueSize}`,
    );
    console.log(
      JSON.stringify({
        tag: "[growth:governance]",
        phase: "completed",
        status: decision.status,
        topRiskCount,
        blockedDomains: decision.blockedDomains.length,
        frozenDomainsHint: frozenCount,
        reviewQueueSize,
        governanceWarnings: governanceWarnings.slice(0, 5),
        blockedCount,
      }),
    );
  } catch {
    /* never throw */
  }
}
