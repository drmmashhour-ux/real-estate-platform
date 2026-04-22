/**
 * Deterministic ranking, deduplication, and impact helpers — advisory only.
 */
import type {
  PolicyProposal,
  PolicyProposalConfidence,
  PolicyProposalImpactEstimate,
  PolicyProposalPriority,
} from "./policy-proposal.types";
import type { PolicySimulationComparisonReport } from "../simulation/policy-simulation.types";

const PRIORITY_ORDER: Record<PolicyProposalPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const CONFIDENCE_ORDER: Record<PolicyProposalConfidence, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export type RankPriorityInput = {
  falseNegativeRate?: number;
  falsePositiveRate?: number;
  leakedRevenueEstimate?: number;
  clusterSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  driftSeverity?: "INFO" | "WARNING" | "CRITICAL";
  driftDeltaAbs?: number;
  repeatedCriticalCluster?: boolean;
};

/** Materiality gates — deterministic constants for v1. */
const FN_MATERIAL = 0.12;
const LEAK_MATERIAL = 400;
const FP_MATERIAL = 0.15;

export function rankPolicyProposalPriority(input: RankPriorityInput): PolicyProposalPriority {
  try {
    const fn = input.falseNegativeRate ?? 0;
    const fp = input.falsePositiveRate ?? 0;
    const leak = input.leakedRevenueEstimate ?? 0;

    if (input.repeatedCriticalCluster || leak >= LEAK_MATERIAL * 2 || fn >= 0.22) return "CRITICAL";
    if (input.clusterSeverity === "CRITICAL" || input.driftSeverity === "CRITICAL" || fn >= FN_MATERIAL)
      return "HIGH";
    if (
      input.clusterSeverity === "HIGH" ||
      input.driftSeverity === "WARNING" ||
      leak >= LEAK_MATERIAL ||
      fp >= FP_MATERIAL
    )
      return "MEDIUM";
    return "LOW";
  } catch {
    return "LOW";
  }
}

export type RankConfidenceInput = {
  evidenceCount: number;
  hasSimulation?: boolean;
  hasCluster?: boolean;
  hasDrift?: boolean;
  hasFeedbackSummary?: boolean;
};

export function rankPolicyProposalConfidence(input: RankConfidenceInput): PolicyProposalConfidence {
  try {
    const strongSources = [input.hasSimulation, input.hasCluster, input.hasDrift, input.hasFeedbackSummary].filter(
      Boolean,
    ).length;
    if (strongSources >= 2 && input.evidenceCount >= 2) return "HIGH";
    if (strongSources >= 1 && input.evidenceCount >= 1) return "MEDIUM";
    return "LOW";
  } catch {
    return "LOW";
  }
}

export function buildImpactEstimateFromSimulationScenarioDelta(delta: {
  falsePositiveRate: number;
  falseNegativeRate: number;
  protectedRevenue: number;
  leakedRevenue: number;
}): PolicyProposalImpactEstimate {
  return {
    expectedFalsePositiveRateDelta: delta.falsePositiveRate,
    expectedFalseNegativeRateDelta: delta.falseNegativeRate,
    expectedProtectedRevenueDelta: delta.protectedRevenue,
    expectedLeakedRevenueDelta: delta.leakedRevenue,
  };
}

/** Dedupe key: proposal type + normalized target slice (no IDs — stable ordering). */
export function proposalDedupeKey(p: PolicyProposal): string {
  const t = p.target;
  return [
    p.type,
    t.metricKey ?? "",
    t.regionCode ?? "",
    t.actionType ?? "",
    t.entityType ?? "",
    t.ruleId ?? "",
  ].join("|");
}

/** Keep highest-priority variant when duplicates share type+target. */
export function dedupePolicyProposals(proposals: PolicyProposal[]): PolicyProposal[] {
  try {
    const map = new Map<string, PolicyProposal>();
    for (const p of proposals) {
      const key = proposalDedupeKey(p);
      const prev = map.get(key);
      if (!prev) {
        map.set(key, p);
        continue;
      }
      if (PRIORITY_ORDER[p.priority] < PRIORITY_ORDER[prev.priority]) {
        map.set(key, p);
        continue;
      }
      if (PRIORITY_ORDER[p.priority] === PRIORITY_ORDER[prev.priority]) {
        if (CONFIDENCE_ORDER[p.confidence] < CONFIDENCE_ORDER[prev.confidence]) map.set(key, p);
      }
    }
    return [...map.values()];
  } catch {
    return proposals;
  }
}

/** CRITICAL > HIGH > MEDIUM > LOW; then confidence HIGH > MEDIUM > LOW; then stable id. */
export function sortPolicyProposals(proposals: PolicyProposal[]): PolicyProposal[] {
  try {
    return [...proposals].sort((a, b) => {
      const pr = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pr !== 0) return pr;
      const cr = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
      if (cr !== 0) return cr;
      return a.id.localeCompare(b.id);
    });
  } catch {
    return proposals;
  }
}

export function unacceptableSimulationFpIncrease(
  scenarioDeltaFalsePositiveRate: number,
  maxIncrease = 0.12,
): boolean {
  return scenarioDeltaFalsePositiveRate > maxIncrease;
}

export function simulationReportToImpactSource(sim: PolicySimulationComparisonReport | undefined): {
  bestDelta?: PolicySimulationComparisonReport["scenarios"][0]["delta"];
} {
  if (!sim?.bestScenarioId) return {};
  const best = sim.scenarios.find((s) => s.configId === sim.bestScenarioId);
  return best ? { bestDelta: best.delta } : {};
}
