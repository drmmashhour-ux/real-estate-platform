import type { CapitalAllocationConfidence, CapitalAllocationScopeType, RoiScopeType, CapitalRecommendationType } from "@prisma/client";

export type InvestorSnapshotView = {
  periodKey: string;
  totalRevenue: number;
  totalWonDeals: number;
  totalLeadSpend: number | null;
  estimatedPipelineValue: number | null;
  avgDealCycleDays: number | null;
  topSegmentJson: unknown;
  weakSegmentJson: unknown;
  capitalAllocationJson: unknown;
  riskSummaryJson: unknown;
  dataSources: string[];
  disclaimer: string;
};

export type CapitalAllocationView = {
  id?: string;
  recommendationKey: string;
  scopeType: CapitalAllocationScopeType;
  scopeKey: string;
  recommendationType: CapitalRecommendationType;
  confidence: CapitalAllocationConfidence;
  rationale: string[];
  expectedImpact: { summary: string; signals: string[] };
  status?: string;
};

export type RoiInsight = {
  scopeType: RoiScopeType;
  scopeKey: string;
  revenue: number;
  wonDeals: number;
  lostDeals: number;
  avgDealCycleDays: number | null;
  estimatedLeadSpend: number | null;
  roiScore: number | null;
  efficiencyScore: number | null;
  /** Trace: how numbers were built */
  trace: string[];
};

export type ExpansionScenarioInput = {
  marketKey: string;
  segmentKey?: string;
  action:
    | "increase_broker_capacity"
    | "shift_lead_routing"
    | "increase_channel_spend"
    | "expansion_dream_home"
    | "green_retrofit_discovery"
    | "generic";
  /** Explicit assumptions — e.g. capacity +10% */
  assumptions: Record<string, string | number | boolean>;
};

export type ExpansionScenarioOutput = {
  scenarioKey: string;
  marketKey: string;
  segmentKey: string | null;
  assumptions: Record<string, string | number | boolean>;
  projectedImpact: { label: string; value: string; basedOn: string }[];
  risks: { type: string; message: string }[];
  confidence: "low" | "medium" | "high";
  rationale: string[];
  disclaimer: string;
};

export type InvestorAlert = {
  type: string;
  severity: "info" | "low" | "medium" | "high";
  message: string;
  rationale: string;
  suggestedResponse: string;
};

export type InvestmentOpportunity = { scopeKey: string; scopeType: RoiScopeType; score: number; rationale: string[] };

export type InvestmentRisk = { type: string; message: string; dataTrace: string };

export type MarketExpansionCandidate = { marketKey: string; openDeals: number; wonDeals: number; avgValue: number | null };
