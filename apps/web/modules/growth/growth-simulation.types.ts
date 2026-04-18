/**
 * Growth simulations — advisory what-if estimates only; not factual truth.
 */

export type GrowthSimulationScenarioType =
  | "increase_acquisition"
  | "fix_conversion"
  | "improve_followup"
  | "improve_content"
  | "mixed_strategy";

export type GrowthSimulationConfidence = "low" | "medium" | "high";

export type GrowthSimulationScenarioInput = {
  id: string;
  type: GrowthSimulationScenarioType;
  title: string;
  assumptions: string[];
  targetChange?: {
    trafficPct?: number;
    conversionPct?: number;
    followUpPct?: number;
    contentQualityPct?: number;
  };
};

export type GrowthSimulationEstimate = {
  metric: "leads" | "conversion" | "response_rate" | "pipeline_health";
  baseline?: number;
  estimatedDeltaPct?: number;
  estimatedValue?: number;
  confidence: GrowthSimulationConfidence;
  rationale: string;
};

export type GrowthSimulationRisk = {
  severity: "low" | "medium" | "high";
  title: string;
  rationale: string;
};

export type GrowthSimulationResult = {
  scenarioId: string;
  title: string;
  estimates: GrowthSimulationEstimate[];
  risks: GrowthSimulationRisk[];
  upsideSummary: string;
  downsideSummary: string;
  recommendation: "consider" | "caution" | "defer";
  confidence: GrowthSimulationConfidence;
  notes: string[];
  createdAt: string;
};

export type GrowthSimulationBundle = {
  baselineSummary: {
    leads?: number;
    topCampaign?: string;
    status?: string;
  };
  scenarios: GrowthSimulationResult[];
  createdAt: string;
};

/** Internal baseline for engines — deterministic inputs only. */
export type GrowthSimulationBaseline = {
  leadsTotal: number;
  hotLeads: number;
  dueNow: number;
  leadsTodayEarly: number;
  topCampaign?: string;
  adsPerformance: "WEAK" | "OK" | "STRONG";
  executiveStatus?: string;
  governanceStatus?: string;
  strategyTopPriority?: string;
  briefFocus?: string;
  missingDataWarnings: string[];
};
