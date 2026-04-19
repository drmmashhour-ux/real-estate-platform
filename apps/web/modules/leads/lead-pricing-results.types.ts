import type { LeadMonetizationConfidenceLevel } from "@/modules/leads/lead-monetization-control.types";
import type { LeadPricingExperimentMode } from "@/modules/leads/lead-pricing-experiments.types";

/** Extends experiment modes with internal override tracking. */
export type LeadPricingModeUsed = LeadPricingExperimentMode | "override" | "baseline";

export type LeadPricingResultWindow = {
  startAt: string;
  endAt: string;
  days: number;
};

export type LeadPricingOperatorAction = "used" | "ignored" | "overridden" | "cleared";

export type LeadPricingObservedOutcome = {
  id: string;
  leadId: string;
  pricingModeUsed: LeadPricingModeUsed;
  displayedAdvisoryPrice: number;
  basePrice: number;
  confidenceLevel: LeadMonetizationConfidenceLevel;
  measuredAt: string;
  operatorActionTaken?: LeadPricingOperatorAction | null;
};

export type LeadPricingSampleStatus = "sufficient" | "sparse" | "insufficient";

export type LeadPricingOutcomeBand = "positive" | "neutral" | "negative" | "insufficient_data";

export type LeadPricingOutcomeSummary = {
  leadId: string;
  pricingModeUsed: LeadPricingModeUsed;
  sampleStatus: LeadPricingSampleStatus;
  window: LeadPricingResultWindow;
  leadProgressDelta?: number;
  unlockDelta?: 0 | 1;
  conversionDelta?: number;
  revenueDelta?: number | null;
  outcomeBand: LeadPricingOutcomeBand;
  explanation: string;
  warnings: string[];
};

export type LeadPricingModePerformance = {
  mode: LeadPricingModeUsed;
  totalCases: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  insufficientCount: number;
  successRate: number | null;
  confidenceLevel: "low" | "medium" | "high";
};

/** Admin GET /api/leads/[id] when lead pricing results flag is on — types only for client surfaces. */
export type LeadPricingResultsAdminPayload = {
  latestObservationId: string | null;
  outcomeSummary: LeadPricingOutcomeSummary | null;
};

/** Baseline JSON stored on observation — internal signals only. */
export type LeadPricingBaselineSnapshot = {
  pipelineStatus: string | null;
  pipelineStage: string | null;
  lecipmCrmStage: string | null;
  contactUnlocked: boolean;
  engagementScore: number;
  progressIndex: number;
  qualityBand?: string;
  qualityScore?: number;
  demandLevel?: string;
  demandScore?: number;
};
