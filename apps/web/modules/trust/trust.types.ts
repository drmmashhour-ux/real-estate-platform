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

// --- BNHub user trust (fraud resistance + explainable scores; no auto-bans) ---

export type BnhubTrustRiskLevel = "LOW" | "MEDIUM" | "HIGH";

/** Host-visible guest trust badge (no raw PII). */
export type BnhubGuestTrustUiLabel = "trusted_guest" | "new_user" | "potential_risk" | "standard";

/** Single explainable input to the BNHub trust score. */
export type BnhubUserTrustFactor = {
  id: string;
  /** Human-readable, safe for host UI / support. */
  label: string;
  /** Points added (positive) or subtracted (negative) before clamp. */
  contribution: number;
  explanation: string;
};

/**
 * BNHub platform trust assessment for a user (guest-centric `score` for booking gates;
 * optional `hostScore` when the user also lists on BNHub).
 */
export type BnhubPlatformUserTrustScore = {
  userId: string;
  /** 0–100, higher = more trusted (used for risk and booking friction). */
  score: number;
  /** 0–100 host-side supplement when the user has listings; does not replace guest score for booking. */
  hostScore: number | null;
  riskLevel: BnhubTrustRiskLevel;
  factors: BnhubUserTrustFactor[];
  /** Short codes for logging / rules (e.g. RAPID_BOOKING_ATTEMPTS). */
  fraudSignalCodes: string[];
  uiLabel: BnhubGuestTrustUiLabel;
  computedAt: string;
};

/** Snapshot stored on booking events / returned to hosts (no PII). */
export type BnhubGuestTrustPublicSnapshot = {
  score: number;
  riskLevel: BnhubTrustRiskLevel;
  uiLabel: BnhubGuestTrustUiLabel;
  fraudSignalCodes: string[];
  factorCount: number;
};
