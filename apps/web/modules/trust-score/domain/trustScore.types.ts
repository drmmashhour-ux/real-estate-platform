/** Deterministic trust engine — not legal verification. */

export type TrustLevelBand = "low" | "medium" | "high" | "verified";

/** 0–100 subscores for weighted TrustScoreRaw. */
export type TrustComponentBreakdown = {
  addressValidity: number;
  mediaQuality: number;
  identityVerification: number;
  sellerDeclarationCompleteness: number;
  legalReadiness: number;
  dataConsistency: number;
};

/** 0–100 confidence subscores for TrustConfidence (weighted sum). */
export type TrustConfidenceBreakdown = {
  addressConfidence: number;
  mediaConfidence: number;
  identityConfidence: number;
  declarationConfidence: number;
  legalConfidence: number;
};

export type TrustScoreResult = {
  /** Final 0–100 after confidence blend and fraud penalty */
  trustScore: number;
  trustScoreRaw: number;
  /** 0–100 aggregate confidence */
  trustConfidence: number;
  fraudPenalty: number;
  level: TrustLevelBand;
  issues: string[];
  strengths: string[];
  issueCodes: string[];
  strengthCodes: string[];
  breakdown: TrustComponentBreakdown;
  confidenceBreakdown: TrustConfidenceBreakdown;
};

/** 0–39 low, 40–64 medium, 65–84 high, 85–100 verified */
export function trustLevelBand(score: number): TrustLevelBand {
  if (score >= 85) return "verified";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}
