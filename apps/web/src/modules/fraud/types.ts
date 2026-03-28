export type FraudEntityType = "listing" | "review" | "user" | "host" | "booking";

export type FraudRiskLevel = "low" | "medium" | "high" | "critical";

export type ExplainableFraudSignal = {
  /** Stable machine key; maps to fraud_flags.flag_type where applicable */
  code: string;
  /** 0–1 relative strength of this signal */
  normalizedStrength: number;
  humanExplanation: string;
  details: Record<string, unknown>;
};

export type FraudScoreComputation = {
  entityType: FraudEntityType;
  entityId: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  signals: ExplainableFraudSignal[];
  evidenceJson: Record<string, unknown>;
};

export const FRAUD_SCORE_VERSION = "lecipm-rules-v1";
