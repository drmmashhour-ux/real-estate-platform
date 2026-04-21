/** Retrofit planner semver — invalidate cached plans when logic changes materially. */
export const ESG_RETROFIT_VERSION = "v1.0.0";

export type RetrofitStrategyType = "BASELINE" | "OPTIMIZED" | "AGGRESSIVE" | "NET_ZERO_PATH";

/** Execution phases (1–5). */
export type RetrofitPhaseNumber = 1 | 2 | 3 | 4 | 5;

export const RETROFIT_PHASE_LABELS: Record<RetrofitPhaseNumber, string> = {
  1: "Data & disclosure",
  2: "Low-cost improvements",
  3: "Operational optimization",
  4: "Capex upgrades",
  5: "Strategic transformation",
};

export type SerializedEsgRetrofitAction = {
  id: string;
  planId: string;
  actionId: string | null;
  title: string;
  category: string;
  phase: number;
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  paybackBand: string | null;
  dependenciesJson: unknown;
  notes: string | null;
  createdAt: string;
};

export type SerializedFinancingOption = {
  id: string;
  listingId: string | null;
  planId: string | null;
  financingType: string;
  name: string;
  provider: string | null;
  eligibilityCriteria: string | null;
  applicableActionsJson: unknown;
  costCoverageBand: string | null;
  benefitType: string;
  priority: string | null;
  notes: string | null;
  reasoning: string | null;
  createdAt: string;
};

export type SerializedRetrofitPlan = {
  id: string;
  listingId: string;
  planName: string;
  strategyType: RetrofitStrategyType;
  summaryText: string | null;
  totalEstimatedCostBand: string | null;
  totalEstimatedImpactBand: string | null;
  totalTimelineBand: string | null;
  expectedScoreBand: string | null;
  expectedCarbonReductionBand: string | null;
  expectedConfidenceImprovement: string | null;
  assumptionsJson: unknown;
  planVersion: string | null;
  createdAt: string;
  updatedAt: string;
  retrofitActions: SerializedEsgRetrofitAction[];
  financingOptions: SerializedFinancingOption[];
};

export type RetrofitPlannerContext = {
  listingId: string;
  compositeScore: number | null;
  grade: string | null;
  dataCoveragePercent: number | null;
  evidenceConfidence: number | null;
  acquisitionReadinessBand: "PASS_LIKELY" | "CONDITIONAL" | "UNKNOWN";
  solarDeclared: boolean;
  renovationDeclared: boolean;
};

export type RetrofitScenarioOutput = {
  totalCostBand: string | null;
  totalImpactBand: string | null;
  timelineBand: string | null;
  expectedScoreBand: string | null;
  expectedCarbonReductionBand: string | null;
  /** Qualitative payback posture — never IRR or dollar ROI. */
  directionalRoiBand: string | null;
  financingFit: string | null;
  risks: string[];
  assumptions: string[];
};

export type InvestorRetrofitAppendix = {
  planName: string | null;
  strategyType: RetrofitStrategyType | null;
  phasedSummary: Array<{ phase: number; label: string; titles: string[] }>;
  topActions: Array<{ title: string; phase: number; costBand: string | null }>;
  costBand: string | null;
  impactBand: string | null;
  timelineBand: string | null;
  financingBullets: string[];
  strategySummary: string;
};
