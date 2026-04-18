/**
 * V8 shadow evaluator — parallel scoring on **read-only** outcome DTOs.
 * Does not call learning adaptation, ingestion writers, or mutate historical rows.
 */
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";
import type { BrainV8ShadowOutcomeRow } from "./brain-v8-shadow.types";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function finiteStoredScore(dto: BrainDecisionOutcomeDTO): { score: number; ok: boolean } {
  const r = dto.outcomeScore;
  if (typeof r !== "number" || !Number.isFinite(r)) return { score: 0, ok: false };
  return { score: clamp(r, -1, 1), ok: true };
}

/**
 * Independent dampened signal from stored outcome fields (shadow-only; not persisted as truth).
 * Non-finite scores yield `insufficient_evidence` — not labeled aligned/review.
 */
export function computeShadowBrainSignal(dto: BrainDecisionOutcomeDTO): {
  shadowSignal: number;
  shadowLabel: "aligned" | "review" | "insufficient_evidence";
  insufficientEvidence: boolean;
} {
  const { score: s, ok } = finiteStoredScore(dto);
  if (!ok) {
    return { shadowSignal: 0, shadowLabel: "insufficient_evidence", insufficientEvidence: true };
  }
  /** Deliberately conservative blend — adjust only inside this V8 module. */
  const shadowSignal = Number((0.55 * s + 0.1 * Math.sin(s * Math.PI)).toFixed(6));
  if (!Number.isFinite(shadowSignal)) {
    return { shadowSignal: 0, shadowLabel: "insufficient_evidence", insufficientEvidence: true };
  }
  const shadowLabel: "aligned" | "review" = Math.abs(s - shadowSignal) < 0.12 ? "aligned" : "review";
  return { shadowSignal, shadowLabel, insufficientEvidence: false };
}

export function buildShadowRowsFromOutcomes(outcomes: BrainDecisionOutcomeDTO[]): BrainV8ShadowOutcomeRow[] {
  return outcomes.map((dto) => {
    const { shadowSignal, shadowLabel, insufficientEvidence } = computeShadowBrainSignal(dto);
    const stored = finiteStoredScore(dto);
    return {
      decisionId: dto.decisionId ?? "(unknown)",
      source: dto.source,
      storedOutcomeScore: stored.ok ? stored.score : 0,
      storedOutcomeType: typeof dto.outcomeType === "string" ? dto.outcomeType : "(unknown)",
      shadowSignal,
      shadowLabel,
      insufficientEvidence: insufficientEvidence || undefined,
    };
  });
}

export function aggregateShadowDeltas(rows: BrainV8ShadowOutcomeRow[]): {
  meanAbsDelta: number;
  reviewCount: number;
  insufficientEvidenceCount: number;
  meanAbsDeltaFiniteSample: number;
} {
  if (rows.length === 0) {
    return { meanAbsDelta: 0, reviewCount: 0, insufficientEvidenceCount: 0, meanAbsDeltaFiniteSample: 0 };
  }
  const insufficientEvidenceCount = rows.filter((r) => r.insufficientEvidence || r.shadowLabel === "insufficient_evidence").length;
  const finite = rows.filter((r) => !r.insufficientEvidence && r.shadowLabel !== "insufficient_evidence");
  const deltas = finite.map((r) => Math.abs(r.shadowSignal - r.storedOutcomeScore)).filter((d) => Number.isFinite(d));
  const meanAbsDeltaFiniteSample =
    deltas.length > 0 ? Number((deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(6)) : 0;
  const reviewCount = rows.filter((r) => r.shadowLabel === "review").length;
  return {
    meanAbsDelta: meanAbsDeltaFiniteSample,
    reviewCount,
    insufficientEvidenceCount,
    meanAbsDeltaFiniteSample,
  };
}
