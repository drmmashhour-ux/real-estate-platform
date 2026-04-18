import { BRAIN_V3_NEGATIVE_MIN_EVIDENCE, BRAIN_V3_NEGATIVE_MIN_VOLUME } from "./brain-v3.constants";
import type { BrainOutcomeRecord, BrainSignalDirection, CrossDomainLearningSignal } from "./brain-v2.types";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function evidenceFromOutcome(o: BrainOutcomeRecord): number {
  const m = o.observedMetrics && typeof o.observedMetrics === "object" ? o.observedMetrics : {};
  const ev = m.evidenceScore;
  if (typeof ev === "number" && Number.isFinite(ev)) return clamp01(ev);
  return clamp01(Math.abs(o.outcomeScore));
}

function sameEntity(a: BrainOutcomeRecord, b: Pick<CrossDomainLearningSignal, "entityId" | "source">): boolean {
  const ae = a.entityId ?? "";
  const be = b.entityId ?? "";
  return String(a.source) === String(b.source) && ae === be && ae.length > 0;
}

export type NegativeValidationResult = {
  signal: CrossDomainLearningSignal;
  /** When true, caller should persist a guard row (low-quality negative spam). */
  guardLowQuality?: boolean;
  guardReason?: string;
};

/**
 * Negative paths require stricter volume + evidence; weak negatives become NEUTRAL (no strong penalty).
 */
export function validateNegativeSignal(
  preliminary: CrossDomainLearningSignal,
  history: BrainOutcomeRecord[],
): NegativeValidationResult {
  if (preliminary.direction !== "NEGATIVE") {
    return { signal: preliminary };
  }

  /** Negative outcomes for same entity (includes current row when present in `history`). */
  const related = history.filter((h) => sameEntity(h, preliminary) && h.outcomeType === "NEGATIVE");
  const positivesRecent = history.filter(
    (h) =>
      sameEntity(h, preliminary) &&
      h.outcomeType === "POSITIVE" &&
      Date.now() - new Date(h.createdAt).getTime() < 7 * 24 * 3600 * 1000,
  );

  const ev = preliminary.metadata && typeof preliminary.metadata === "object" ? preliminary.metadata : {};
  const evidenceScore =
    typeof (ev as { evidenceScore?: number }).evidenceScore === "number" ?
      clamp01((ev as { evidenceScore: number }).evidenceScore)
    : preliminary.durability.confidence;

  let direction: BrainSignalDirection = "NEGATIVE";
  let magnitude = preliminary.magnitude;
  let reason = preliminary.reason;
  let guardLowQuality = false;
  let guardReason: string | undefined;

  if (positivesRecent.length >= 1 && related.length < BRAIN_V3_NEGATIVE_MIN_VOLUME) {
    direction = "NEUTRAL";
    magnitude = clamp01(magnitude * 0.25);
    reason = `${preliminary.reason} [V3: downgraded — recent positive signal on same entity; no strong negative without corroboration]`;
  } else if (related.length < BRAIN_V3_NEGATIVE_MIN_VOLUME) {
    direction = "NEUTRAL";
    magnitude = clamp01(magnitude * 0.35);
    reason = `${preliminary.reason} [V3: downgraded — insufficient negative volume (${related.length}/${BRAIN_V3_NEGATIVE_MIN_VOLUME})]`;
  } else if (evidenceScore < BRAIN_V3_NEGATIVE_MIN_EVIDENCE) {
    direction = "NEUTRAL";
    magnitude = clamp01(magnitude * 0.3);
    reason = `${preliminary.reason} [V3: downgraded — evidence below negative bar (${evidenceScore.toFixed(2)} < ${BRAIN_V3_NEGATIVE_MIN_EVIDENCE})]`;
    guardLowQuality = related.length >= 2;
    guardReason = "Repeated low-evidence negative attempts";
  }

  return {
    signal: {
      ...preliminary,
      direction,
      magnitude,
      reason,
      durability: preliminary.durability,
    },
    guardLowQuality,
    guardReason,
  };
}

/** Extract evidence score from outcome for durability weighting. */
export function outcomeEvidenceHint(o: BrainOutcomeRecord): number {
  return evidenceFromOutcome(o);
}
