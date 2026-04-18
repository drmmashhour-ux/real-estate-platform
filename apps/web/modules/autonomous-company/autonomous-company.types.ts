/**
 * Autonomous AI Company Mode — advisory orchestration types (no financial truth; execution gated).
 */

import type { AutonomousCompanyModeTier } from "@/config/feature-flags";
import type { OperatorExecutionPlan } from "@/modules/operator/operator-v2.types";

export type { AutonomousCompanyModeTier };

export type StrategyObjective = {
  id: string;
  title: string;
  rationale: string;
};

export type StrategyOpportunity = {
  id: string;
  domain: string;
  summary: string;
};

export type StrategyRisk = {
  id: string;
  severity: "low" | "medium" | "high";
  summary: string;
};

export type StrategyPriority = {
  rank: number;
  label: string;
};

export type StrategyEngineOutput = {
  objectives: StrategyObjective[];
  opportunities: StrategyOpportunity[];
  risks: StrategyRisk[];
  priorities: StrategyPriority[];
  notes: string[];
};

export type RankedOpportunity = {
  id: string;
  title: string;
  domain: "ads" | "cro" | "marketplace" | "behavior" | "fusion" | "operator";
  impact: number;
  confidence: number;
  effort: number;
  urgency: number;
  score: number;
  rationale: string;
};

export type OpportunityEngineOutput = {
  ranked: RankedOpportunity[];
  notes: string[];
};

export type CompanyFusionDecision = {
  id: string;
  opportunityId: string;
  title: string;
  priorityScore: number;
  systems: string[];
  conflictsWith: string[];
};

export type CompanyFusionDecisionSet = {
  decisions: CompanyFusionDecision[];
  conflictPairsApprox: number;
  notes: string[];
};

export type CompanyExecutionResult = {
  mode: AutonomousCompanyModeTier;
  plan: OperatorExecutionPlan | null;
  notes: string[];
};

export type LearningAggregatorSnapshot = {
  successRateApprox: number | null;
  roiApprox: number | null;
  accuracyApprox: number | null;
  failurePatterns: string[];
  notes: string[];
};

export type AdaptationWeightDelta = {
  key: string;
  delta: number;
  bound: number;
};

export type AdaptationEngineSuggestion = {
  weightDeltasSuggested: AdaptationWeightDelta[];
  thresholdDeltasSuggested: AdaptationWeightDelta[];
  reversible: boolean;
  notes: string[];
};

export type ContentGrowthDraftBundle = {
  listingDescriptions: Array<{ id: string; draft: string }>;
  adCopyVariants: Array<{ id: string; draft: string }>;
  seoPageOutlines: Array<{ id: string; outline: string }>;
  socialHooks: string[];
  publishAllowed: boolean;
  notes: string[];
};

export type MarketIntelligenceSummary = {
  trends: string[];
  demandSignals: string[];
  pricingNotes: string[];
  locationNotes: string[];
  generatedAt: string;
  warnings: string[];
};

export type AutonomousCompanyCycleResult = {
  cycleId: string;
  timestamp: string;
  mode: AutonomousCompanyModeTier;
  strategy: StrategyEngineOutput | null;
  opportunities: OpportunityEngineOutput | null;
  decisions: CompanyFusionDecisionSet | null;
  execution: CompanyExecutionResult | null;
  learning: LearningAggregatorSnapshot | null;
  adaptation: AdaptationEngineSuggestion | null;
  content: ContentGrowthDraftBundle | null;
  market: MarketIntelligenceSummary | null;
  observability: {
    cyclesSession: number;
    opportunitiesDetected: number;
    decisionsCount: number;
    actionsPlanned: number;
  };
  notes: string[];
  warnings: string[];
};
