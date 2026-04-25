/**
 * BNHUB fraud detection — types only. No enforcement actions here.
 */

export type FraudEntityType = "short_term_listing" | "booking" | "user";

export type FraudRiskLevel = "LOW" | "MEDIUM" | "HIGH";

/** Weighted signal hits (all derived from real DB fields in collectors). */
export type FraudSignalHit = {
  key: string;
  weight: number;
  detail?: string;
};

export type FraudAssessment = {
  entityType: FraudEntityType;
  entityId: string;
  riskLevel: FraudRiskLevel;
  /** 0–100 deterministic score */
  riskScore: number;
  reasons: string[];
  signalHits: FraudSignalHit[];
};

/** Declarative: safe automation may be reduced for these levels on the entity. */
export const FRAUD_AUTOPILOT_SUPPRESSION_LEVELS: readonly FraudRiskLevel[] = ["MEDIUM", "HIGH"];
