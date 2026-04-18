/**
 * Trust layer — consumer-safe labels only; fraud suspicion stays admin/internal.
 */

export type TrustRiskLevel = "low" | "medium" | "high" | "critical";

export type TrustEvaluation = {
  /** 0–100 higher = more trustworthy (not inverse of fraud score alone). */
  score: number;
  /** 0–1 data sufficiency for this evaluation. */
  confidence: number;
  /** Residual risk band — aligns with fraud/risk pipeline when linked. */
  riskLevel: TrustRiskLevel;
  explanation: string[];
};

/** Safe for cards / badges — never implies fraud. */
export type PublicTrustPresentation = {
  badge: "verified" | "high_trust" | "new_listing" | "under_review" | "standard";
  subtitle: string;
};
