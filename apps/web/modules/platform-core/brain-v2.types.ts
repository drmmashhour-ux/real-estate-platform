/**
 * LECIPM PLATFORM — One Brain V2 adaptive learning types (explainable; no black-box ML).
 */

import type { CoreEntityType, CoreSystemSource } from "./platform-core.types";

export type BrainOutcomeType = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "INSUFFICIENT_DATA";

export type BrainLearningSource =
  | "ADS"
  | "CRO"
  | "RETARGETING"
  | "AB_TEST"
  | "PROFIT"
  | "MARKETPLACE"
  | "UNIFIED";

export type BrainSourceWeight = {
  source: BrainLearningSource;
  /** Capped adaptive multiplier (see brain-v2.constants). */
  weight: number;
  confidence: number;
  sampleCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  lastLearnedAt?: string | null;
};

export type BrainOutcomeRecord = {
  decisionId: string;
  source: BrainLearningSource;
  entityType: string;
  entityId?: string | null;
  actionType: string;
  outcomeType: BrainOutcomeType;
  outcomeScore: number;
  observedMetrics?: Record<string, unknown>;
  reason: string;
  createdAt: string;
};

export type BrainAdaptiveResult = {
  adjustedTrustScore: number;
  sourceWeightApplied: number;
  adaptationReason: string;
};

export type BrainLearningSnapshot = {
  weights: BrainSourceWeight[];
  lastUpdatedAt: string;
  notes: string[];
};

// ---------------------------------------------------------------------------
// One Brain V3 — cross-domain learning + durability (additive to V2)
// ---------------------------------------------------------------------------

export type BrainSignalDirection = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export type BrainSignalDurability = {
  stabilityScore: number;
  decayFactor: number;
  confidence: number;
};

export type CrossDomainLearningSignal = {
  source: CoreSystemSource;
  entityId?: string;
  entityType?: CoreEntityType;
  direction: BrainSignalDirection;
  magnitude: number;
  durability: BrainSignalDurability;
  reason: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type BrainCrossDomainImpact = {
  source: CoreSystemSource;
  affectedDomain: CoreSystemSource;
  impactWeight: number;
  reason: string;
};
