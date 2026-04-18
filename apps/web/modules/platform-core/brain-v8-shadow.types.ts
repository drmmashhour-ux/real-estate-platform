/**
 * V8 Brain shadow layer — types only; does not affect persisted outcomes or learning loops.
 */
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";

export type BrainV8ShadowOutcomeRow = {
  decisionId: string;
  source: BrainDecisionOutcomeDTO["source"];
  storedOutcomeScore: number;
  storedOutcomeType: string;
  shadowSignal: number;
  shadowLabel: "aligned" | "review" | "insufficient_evidence";
  /** True when `outcomeScore` was missing or non-finite — deltas excluded from primary aggregate. */
  insufficientEvidence?: boolean;
};

export type BrainV8ShadowObservationResult = {
  observedAt: string;
  sampleSize: number;
  rows: BrainV8ShadowOutcomeRow[];
  aggregate: {
    meanAbsDelta: number;
    reviewCount: number;
    insufficientEvidenceCount: number;
    /** Mean delta over rows with finite stored scores only (empty when none). */
    meanAbsDeltaFiniteSample: number;
  };
  notes: string[];
};
