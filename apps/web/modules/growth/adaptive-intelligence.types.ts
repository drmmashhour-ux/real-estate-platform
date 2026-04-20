/**
 * Adaptive growth intelligence — suggestion-only; approval-based; no automation or sends.
 */

export type AdaptiveDecisionCategory = "closing" | "timing" | "retention" | "routing" | "growth";

export type AdaptiveDecisionPriority = "critical" | "high" | "medium";

export type AdaptiveConfidence = "low" | "medium" | "high";

export type AdaptiveDecision = {
  id: string;
  category: AdaptiveDecisionCategory;
  priority: AdaptiveDecisionPriority;
  /** Operator-facing verb phrase — not an automated action. */
  action: string;
  /** Short deterministic rationale tied to signals below. */
  reason: string;
  supportingSignals: string[];
  confidence: AdaptiveConfidence;
  requiresApproval: true;
  /** Plain-language impact framing — still correlational / advisory. */
  whyItMatters: string;
};

export type AdaptiveTopLeadSnapshot = {
  /** Rule-based CRM score (0–100), not ML. */
  score: number;
  pipelineStage: string;
  /** Hours since Lead.updatedAt — proxy for follow-up urgency. */
  hoursSinceTouch: number;
};

/** Counts-only snapshot from deal / execution measurement — no broker or lead IDs. */
export type AdaptiveDealPerformanceSignals = {
  windowDays: number;
  aiRows: number;
  aiPositiveBands: number;
  sparseAiTelemetry: boolean;
  brokerRows: number;
  brokerPositiveBands: number;
};

export type AdaptiveContext = {
  generatedAt: string;
  topLead?: AdaptiveTopLeadSnapshot;
  /** From FSBO-linked CRM leads in-window city aggregation when available. */
  hottestCity?: string;
  hottestCityLeadCount?: number;
  weakestStage?: { stage: string; count: number };
  /** Advisory timing labels from timing optimizer (human judgment still applies). */
  bestTimingWindow?: string;
  timingUrgencyHint?: "critical" | "high" | "standard";
  brokerDependencySignals: string[];
  highestBrokerDependency?: { score: number; tier: string };
  /** e.g. lead counts, mix — no PII. */
  pipelineStatus: string;
  /** Execution planner summary or explicit “unavailable”. */
  executionStatus: string;
  /** One ethical nudge axis from closing psychology (template library; human-delivered). */
  closingPsychologyAxis?: string;
  /** Correlational revenue / pipeline note (not cash truth). */
  revenueSignalSummary?: string;
  /** Growth execution / “deal performance” measurement layer — optional when flag enabled. */
  dealPerformance?: AdaptiveDealPerformanceSignals;
  /** Mapped from illustrative revenue forecast meta — advisory only, not bookings. */
  revenueForecastConfidence?: AdaptiveConfidence;
  revenueForecastInsufficientData?: boolean;
  /** True when few rows support inferences. */
  sparseSignals: boolean;
};

export type AdaptiveIntelligenceSnapshot = {
  context: AdaptiveContext;
  decisions: AdaptiveDecision[];
  generatedAt: string;
  note: string;
};
