/**
 * Growth execution results — internal measurement; not causal proof; no auto-execution.
 */

export type OutcomeBand = "positive" | "neutral" | "negative" | "insufficient_data";

export type AiExecutionUsageOutcome = {
  suggestionId: string;
  createdAt: string;
  /** True if a view or interaction event exists in the window, or panel view was recorded. */
  viewed: boolean;
  copied: boolean;
  locallyApproved: boolean;
  ignored: boolean;
  outcomeBand: OutcomeBand;
  explanation: string;
};

export type BrokerCompetitionOutcome = {
  brokerId: string;
  tier: "standard" | "preferred" | "elite";
  /** Activity / competition composite 0–100 (from profile). */
  score: number;
  measuredAt: string;
  leadActivityDelta?: number;
  closeSignalDelta?: number;
  outcomeBand: OutcomeBand;
  explanation: string;
};

export type ScaleSystemTargetType = "leads" | "brokers" | "revenue";

export type ScaleSystemOutcome = {
  measuredAt: string;
  targetType: ScaleSystemTargetType;
  currentValue: number;
  previousValue: number;
  delta: number;
  gapChange: number;
  outcomeBand: OutcomeBand;
  explanation: string;
};

export type GrowthExecutionResultsSummary = {
  aiAssistResults: AiExecutionUsageOutcome[];
  brokerCompetitionResults: BrokerCompetitionOutcome[];
  scaleResults: ScaleSystemOutcome[];
  insights: string[];
  sparseDataWarnings: string[];
  generatedAt: string;
  windowDays: number;
};
