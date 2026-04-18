/**
 * Fusion observability / health (process-local + per-run counts).
 */
import type {
  FusionAdvisoryKind,
  FusionConflict,
  FusionHealthSummary,
  FusionNormalizedSignal,
  FusionRecommendation,
  FusionSignalSource,
} from "./fusion-system.types";
import type { FusionRawGather } from "./fusion-system.gather";

export function buildFusionHealthSummary(
  signals: FusionNormalizedSignal[],
  conflicts: FusionConflict[],
  recommendations: FusionRecommendation[],
  raw: FusionRawGather,
): FusionHealthSummary {
  const subsystemsTotal = 4;
  const uniqueSources = new Set(signals.map((s) => s.source));
  const subsystemsAvailable = uniqueSources.size;

  const conflictByCategory: Record<string, number> = {};
  for (const c of conflicts) {
    conflictByCategory[c.category] = (conflictByCategory[c.category] ?? 0) + 1;
  }

  const recommendationsByKind = {} as Record<FusionAdvisoryKind, number>;
  for (const r of recommendations) {
    recommendationsByKind[r.kind] = (recommendationsByKind[r.kind] ?? 0) + 1;
  }

  const insuff = recommendations.filter((r) => r.kind === "insufficient_evidence").length;
  const insufficientEvidenceRate = recommendations.length ? insuff / recommendations.length : 0;

  const bySrc = (s: FusionSignalSource) => signals.filter((x) => x.source === s).length;
  const pairs = [
    bySrc("brain") && bySrc("ads"),
    bySrc("brain") && bySrc("operator"),
    bySrc("ads") && bySrc("operator"),
    bySrc("platform_core") && bySrc("operator"),
  ].filter(Boolean).length;

  const observationalWarnings: string[] = [...raw.gatherWarnings];
  if (raw.gatherWarnings.length) {
    observationalWarnings.push("gather_partial_failure");
  }
  if (subsystemsAvailable < 2 && signals.length > 15) {
    observationalWarnings.push("few_subsystems_but_many_signals_check_provenance");
  }
  if (signals.length === 0 && subsystemsAvailable >= 2) {
    observationalWarnings.push("fusion_empty_while_subsystems_marked_available");
  }
  const highConflictRate = conflicts.length > 8;
  if (highConflictRate) {
    observationalWarnings.push("repeated_cross_system_conflicts");
  }
  if (insufficientEvidenceRate > 0.5 && recommendations.length > 2) {
    observationalWarnings.push("high_insufficient_evidence_rate");
  }

  const malformed = signals.filter((s) => {
    const nums = [s.confidence, s.trust, s.priority, s.risk, s.evidenceQuality].filter(
      (v): v is number => typeof v === "number",
    );
    return nums.some((n) => !Number.isFinite(n));
  });
  if (malformed.length) {
    observationalWarnings.push("malformed_normalized_signals_detected");
  }

  const highDisagreement =
    signals.length >= 8 && conflicts.length / Math.max(signals.length, 1) > 0.35;
  if (highDisagreement) {
    observationalWarnings.push("unusually_high_disagreement_rate");
  }

  return {
    subsystemsAvailable,
    subsystemsTotal,
    normalizedSignalCount: signals.length,
    agreementPairsApprox: pairs,
    disagreementPairsApprox: conflicts.length,
    conflictCount: conflicts.length,
    conflictByCategory,
    recommendationsByKind,
    insufficientEvidenceRate,
    observationalWarnings,
  };
}
