/** Revenue Predictor — operational / probabilistic; never guaranteed outcomes. */

export type PipelineStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "DEMO_SCHEDULED"
  | "QUALIFIED"
  | "OFFER"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type ConfidenceLabel = "LOW" | "MEDIUM" | "HIGH";

export type ImprovementTrend = "up" | "flat" | "down";

/** CRM-style snapshot merged from acquisition + manual entry until API wiring. All money in cents. */
export type RevenueFinancialSnapshot = {
  userId: string;
  averageDealValueCents: number;
  pipelineValueCents: number;
  /** Open opportunities count */
  openDeals: number;
  /** Deal counts currently in each stage */
  conversionByStage: Partial<Record<PipelineStage, number>>;
  hubType?: string;
  region?: string;
  dealType?: string;
  /** Optional multiplier 0.92–1.08 */
  seasonalityFactor?: number;
  /** Optional demand signal 0.88–1.1 */
  currentDemandSignal?: number;
  updatedAtIso: string;
};

export type SalespersonPredictorInput = {
  userId: string;
  displayName?: string;
  totalCalls: number;
  demosBooked: number;
  closesWon: number;
  closesLost: number;
  averageCallScore: number;
  averageControlScore: number;
  averageClosingScore: number;
  trainingScore: number;
  objectionSuccessRate: number;
  improvementTrend: ImprovementTrend;
  averageDealValueCents: number;
  pipelineValueCents: number;
  currentOpenDeals: number;
  conversionByStage: Partial<Record<PipelineStage, number>>;
  hubType?: string;
  region?: string;
  dealType?: string;
  seasonalityFactor?: number;
  currentDemandSignal?: number;
};

export type TeamPredictorInput = {
  teamId: string;
  teamName: string;
  memberIds: string[];
  totalPipelineValueCents: number;
  teamCloseRate: number;
  teamAverageCallScore: number;
  totalBookedDemos: number;
  totalForecastableRevenueCents: number;
};

export type PipelinePredictorFilters = {
  hubType?: string;
  region?: string;
  dealType?: string;
  teamId?: string;
};

export type ForecastRangeCents = {
  conservativeCents: number;
  baseCents: number;
  upsideCents: number;
};

export type RevenueExplainability = {
  confidenceLabel: ConfidenceLabel;
  confidenceRationale: string;
  factorsIncreasing: string[];
  factorsReducing: string[];
  stageConcentrationRisks: string[];
  coachingUpliftReason?: string;
};

export type SalespersonRevenueForecast = {
  userId: string;
  forecastPeriodLabel: string;
  /** Weighted probability 0–1 used for pipeline conversion story */
  weightedCloseProbability: number;
  ranges: ForecastRangeCents;
  coachingUpliftCents: number;
  coachingUpliftPctBand: { low: number; high: number };
  downsideRiskCents: number;
  explainability: RevenueExplainability;
  generatedAtIso: string;
};

export type TeamRevenueForecast = {
  teamId: string;
  ranges: ForecastRangeCents;
  coachingUpliftCentsAggregate: number;
  explainability: RevenueExplainability;
  memberForecasts: { userId: string; displayName?: string; baseCents: number; riskBadge: "low" | "med" | "high" }[];
  generatedAtIso: string;
};

export type PipelineForecastResult = {
  filters: PipelinePredictorFilters;
  totalPipelineCents: number;
  expectedCloseWeightedCents: number;
  ranges: ForecastRangeCents;
  explainability: RevenueExplainability;
};

export type CoachingUpliftForecast = {
  currentBaseForecastCents: number;
  potentialUpliftCents: number;
  upliftLowPct: number;
  upliftHighPct: number;
  narrative: string;
  confidenceLabel: ConfidenceLabel;
};

export type RiskDownsideForecast = {
  downsideCents: number;
  drivers: string[];
  narrative: string;
};

export type OpportunityLossEstimate = {
  estimatedLostRevenueCents: number;
  topLossDrivers: { label: string; impactCents: number }[];
  leakingStages: { stage: PipelineStage; lostCents: number }[];
  notes: string[];
};

export type RevenuePredictorAlert = {
  id: string;
  kind:
    | "forecast_drop"
    | "pipeline_concentration"
    | "rep_below_threshold"
    | "high_coaching_upside"
    | "team_forecast_shift";
  severity: "info" | "warn";
  title: string;
  body: string;
  targets?: { userId?: string; teamId?: string };
  createdAtIso: string;
};
