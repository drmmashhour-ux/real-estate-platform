/** Internal fraud / risk — do not expose raw signals publicly without sanitization. */

export type FraudRiskLevel = "low" | "medium" | "high" | "critical";

export type FraudSignal = {
  code: string;
  /** 0–100 subscore contribution hint */
  weightHint: number;
  message: string;
  /** Safe for logs / admin UI */
  safeSummary: string;
};

export type FraudScoreResult = {
  fraudScore: number;
  riskLevel: FraudRiskLevel;
  /** Escalate to human review — never auto-ban from this score alone */
  reviewRecommended: boolean;
  signals: FraudSignal[];
  /** Points subtracted from trust (deterministic caps per signal family) */
  trustPenaltyPoints: number;
  /** Optional one-line cluster hint for analysts */
  clusterSummary?: string;
};
