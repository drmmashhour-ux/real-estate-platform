/**
 * Launch Sequencer AI — planning types only. Recommendations are scenario-based and non-binding.
 * Does not assert legal clearance or market authorization.
 */

export type LaunchCandidateMarket = {
  marketKey: string;
  /** Inferred upside / strategic fit (0–100). Undefined lowers confidence in sequencing. */
  opportunityScore?: number;
  /** Operational / regulatory load proxy (0–100, higher = harder). */
  operationalComplexity?: number;
  /** Localization pack maturity (0–100). */
  localizationReadiness?: number;
  /** Compliance / policy pack signals (0–100). */
  complianceReadiness?: number;
  /** Broker / ops capacity proxy (0–100). */
  staffingReadiness?: number;
  /** Product surface readiness (0–100). */
  productReadiness?: number;
  /** Confidence in underlying inputs (0–100). Low → conservative outputs. */
  dataConfidence?: number;
  /** Scenario label for explainability (e.g. config-derived). */
  scenarioNote?: string;
};

export type LaunchReadinessLabel = "not_ready" | "pilot_ready" | "limited_launch_ready" | "launch_ready";

export type LaunchReadinessScore = {
  score: number;
  label: LaunchReadinessLabel;
  rationale: string[];
};

export type LaunchDependencyType =
  | "COMPLIANCE"
  | "LOCALIZATION"
  | "STAFFING"
  | "PRODUCT"
  | "DATA"
  | "POLICY";

export type LaunchDependency = {
  key: string;
  type: LaunchDependencyType;
  title: string;
  severity: "low" | "medium" | "high";
  blocking: boolean;
  rationale: string[];
};

export type LaunchFeatureSubset = {
  marketKey: string;
  enabledFeatures: string[];
  restrictedFeatures: string[];
  blockedFeatures: string[];
  rationale: string[];
};

export type LaunchMode =
  | "READ_ONLY_INTELLIGENCE"
  | "BROKER_ASSISTED_PILOT"
  | "LIMITED_PRODUCTION"
  | "FULL_PRODUCTION";

export type LaunchRiskItem = {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  rationale: string[];
};

export type LaunchRiskProfile = {
  overallRisk: "low" | "medium" | "high";
  risks: LaunchRiskItem[];
};

export type LaunchSequenceRecommendation = {
  marketKey: string;
  priorityRank: number;
  launchMode: LaunchMode;
  readiness: LaunchReadinessScore;
  dependencies: LaunchDependency[];
  featureSubset: LaunchFeatureSubset;
  riskProfile: LaunchRiskProfile;
  rationale: string[];
};

export type LaunchSequencerOutput = {
  recommendations: LaunchSequenceRecommendation[];
  summary: string[];
  topPriorityMarket?: string;
  topBlockers: string[];
  /** ISO timestamp for snapshot freshness. */
  generatedAt: string;
  /** Explicit uncertainty when inputs were sparse. */
  dataQualityNote: string;
};
