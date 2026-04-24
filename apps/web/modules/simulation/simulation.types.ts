/**
 * Marketplace what-if sandbox — all outputs are simulated; never mutates production rules or entities.
 */

export type AutopilotLevel = 0 | 1 | 2 | 3;

/** Admin-tuned scenario knobs (dimensionless or documented units). */
export type ScenarioInput = {
  leadVolumeMultiplier: number;
  /** Negative = faster responses (e.g. -0.2 = 20% faster). */
  responseSpeedChange: number;
  /** Fractional change to effective pricing / take rate (e.g. 0.05 = +5%). */
  pricingAdjustment: number;
  /** 0–1 boost to acquisition demand signal. */
  marketingBoost: number;
  /** Admin trust gate shift in points (negative = stricter). */
  trustThresholdChange: number;
  autopilotLevel: AutopilotLevel;
  /** City/region key from City table or coarse market id; optional. */
  regionKey: string | null;
};

export type SimulationBaseline = {
  generatedAt: string;
  activeDeals: number;
  pipelineValueCents: number;
  leads30d: number;
  conversionPct: number;
  trustScore: number | null;
  disputeRisk0to100: number | null;
  openDisputes: number;
  /** Heuristic weekly ops hours proxy. */
  workloadUnits: number;
  regionLabel: string | null;
};

export type PredictedMetrics = {
  revenueChangePct: number;
  conversionChangePts: number;
  disputeRiskChangePts: number;
  trustChangePts: number;
  workloadChangePct: number;
  /** Human-readable headline for exec view. */
  narrative: string;
};

export type SimulationConfidence = "low" | "medium" | "high";

export type RecommendedAction = {
  id: string;
  label: string;
  rationale: string;
  href: string;
};

export type WhatIfResult = {
  /** Always true in API responses — UI should still show the banner. */
  simulated: true;
  scenario: ScenarioInput;
  baseline: SimulationBaseline;
  predictedMetrics: PredictedMetrics;
  confidenceLevel: SimulationConfidence;
  riskWarnings: string[];
  recommendedActions: RecommendedAction[];
  /** Plain-language model assumptions for auditability. */
  assumptions: string[];
};

export type SavedScenarioListItem = {
  id: string;
  name: string;
  regionKey: string | null;
  params: ScenarioInput;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
  lastResult: WhatIfResult | null;
};
