/**
 * Trust layer — operational / product signals only (not legal findings).
 */

export type TrustLevel = "low" | "medium" | "high" | "verified" | "premium";

export type TrustScore = {
  score: number;
  level: TrustLevel;
  confidence: "low" | "medium" | "high";
  factors: string[];
};

export type TrustFactor =
  | "legal_readiness"
  | "quebec_compliance"
  | "legal_record_compliance"
  | "document_approval_rate"
  | "review_history"
  | "intelligence_signals"
  | "account_age"
  | "activity_consistency"
  | "timeline_document_outcomes"
  | "verification_status";

export type TrustBadge =
  | "verified_owner"
  | "verified_host"
  | "trusted_broker"
  | "high_compliance"
  | "premium_trusted";

export type TrustVisibilityImpact = {
  /** Multiplier applied to ranking sort keys (≥ ~0.97; never zero). */
  rankingBoost: number;
  exposureLevel: "limited" | "normal" | "boosted";
};

/** Serializable public slice for listings / APIs (no PII). */
export type PublicTrustPayload = {
  score: number;
  level: TrustLevel;
  confidence: TrustScore["confidence"];
  badges: TrustBadge[];
  factors: string[];
  visibility: TrustVisibilityImpact;
};
