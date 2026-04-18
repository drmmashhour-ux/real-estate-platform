/**
 * Bounded fusion-level scores. Explicit default weights — does not alter subsystem-internal weights.
 * Defaults: equal 0.25 per subsystem when present; missing subsystems reduce denominator.
 */
import type { FusionConflict, FusionNormalizedSignal, FusionScore, FusionSignalSource } from "./fusion-system.types";

const W_BRAIN = 0.25;
const W_ADS = 0.25;
const W_OP = 0.25;
const W_PC = 0.25;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function meanField(signals: FusionNormalizedSignal[], field: keyof FusionNormalizedSignal): number {
  const vals = signals
    .map((s) => s[field])
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function hasSource(signals: FusionNormalizedSignal[], source: FusionSignalSource): boolean {
  return signals.some((s) => s.source === source);
}

export function computeFusionScores(signals: FusionNormalizedSignal[], conflicts: FusionConflict[]): FusionScore {
  const by = (src: FusionSignalSource) => signals.filter((s) => s.source === src);

  const presentWeight =
    (hasSource(signals, "brain") ? W_BRAIN : 0) +
    (hasSource(signals, "ads") ? W_ADS : 0) +
    (hasSource(signals, "operator") ? W_OP : 0) +
    (hasSource(signals, "platform_core") ? W_PC : 0);

  const fusedConfidence =
    presentWeight > 0
      ? (meanField(by("brain"), "confidence") * (hasSource(signals, "brain") ? W_BRAIN : 0) +
          meanField(by("ads"), "confidence") * (hasSource(signals, "ads") ? W_ADS : 0) +
          meanField(by("operator"), "confidence") * (hasSource(signals, "operator") ? W_OP : 0) +
          meanField(by("platform_core"), "confidence") * (hasSource(signals, "platform_core") ? W_PC : 0)) /
        presentWeight
      : 0;

  const fusedPriority =
    presentWeight > 0
      ? (meanField(by("brain"), "priority") * (hasSource(signals, "brain") ? W_BRAIN : 0) +
          meanField(by("ads"), "priority") * (hasSource(signals, "ads") ? W_ADS : 0) +
          meanField(by("operator"), "priority") * (hasSource(signals, "operator") ? W_OP : 0) +
          meanField(by("platform_core"), "priority") * (hasSource(signals, "platform_core") ? W_PC : 0)) /
        Math.max(presentWeight, 0.25)
      : 0;

  const fusedRisk =
    presentWeight > 0
      ? (meanField(by("brain"), "risk") * (hasSource(signals, "brain") ? W_BRAIN : 0) +
          meanField(by("ads"), "risk") * (hasSource(signals, "ads") ? W_ADS : 0) +
          meanField(by("operator"), "risk") * (hasSource(signals, "operator") ? W_OP : 0) +
          meanField(by("platform_core"), "risk") * (hasSource(signals, "platform_core") ? W_PC : 0)) /
        presentWeight
      : 0;

  const highSev = conflicts.filter((c) => c.severity === "high").length;
  const medSev = conflicts.filter((c) => c.severity === "medium").length;
  const conflictPenalty = clamp01(highSev * 0.12 + medSev * 0.06);

  const fusedReadiness = clamp01(fusedConfidence * (1 - fusedRisk * 0.85) * (1 - conflictPenalty) + 0.05 * (presentWeight || 0));

  const agreementScore = clamp01(1 - Math.min(1, fusedRisk + conflictPenalty));

  const evidenceQuality = clamp01(meanField(signals, "evidenceQuality"));

  const actionabilityScore = clamp01(fusedReadiness * agreementScore * (0.5 + 0.5 * evidenceQuality));

  return {
    fusedConfidence: clamp01(fusedConfidence),
    fusedPriority: clamp01(fusedPriority || meanField(signals, "priority")),
    fusedRisk: clamp01(fusedRisk),
    fusedReadiness,
    agreementScore,
    evidenceQuality,
    actionabilityScore,
  };
}
