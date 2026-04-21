/** Portfolio intelligence + asset manager — typed payloads (deterministic-first, explainable). */

export type HealthBand = "STRONG" | "STABLE" | "WATCHLIST" | "AT_RISK" | "CRITICAL";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type ObjectiveMode =
  | "RISK_REDUCTION"
  | "CASHFLOW_STABILITY"
  | "ESG_ADVANCEMENT"
  | "COMPLIANCE_CLEANUP"
  | "CAPITAL_EFFICIENCY"
  | "BALANCED";

export type PolicyAutonomyMode = "OFF" | "ASSIST" | "SAFE_APPROVAL" | "AUTO_LOW_RISK";

export type PriorityCategory =
  | "URGENT_FIX"
  | "QUICK_WIN"
  | "CAPITAL_PROJECT"
  | "COMPLIANCE"
  | "ESG"
  | "REVENUE"
  | "FINANCING";

export interface HealthDimensionExplanation {
  score: number;
  /** Human-readable factors used in scoring (audit / explainability). */
  factors: Array<{ key: string; contribution: number; detail: string }>;
}

export interface PortfolioHealthResult {
  overallHealthScore: number;
  healthBand: HealthBand;
  subscores: {
    revenue: HealthDimensionExplanation;
    esg: HealthDimensionExplanation;
    compliance: HealthDimensionExplanation;
    financing: HealthDimensionExplanation;
    operations: HealthDimensionExplanation;
  };
  blockers: Array<{ code: string; severity: string; description: string }>;
  opportunities: Array<{ code: string; upside: string; description: string }>;
  explanation: string;
}

export interface PortfolioPriorityRow {
  assetId: string;
  assetName?: string;
  priorityType: PriorityCategory;
  rank: number;
  priorityScore: number;
  title: string;
  explanation: string;
  actionHint?: Record<string, unknown>;
}

export interface CapitalAllocationOutput {
  allocationSummary: Array<{
    assetId: string;
    assetName?: string;
    budgetBand: "LOW_BUDGET" | "MEDIUM_BUDGET" | "HIGH_BUDGET" | "OPPORTUNISTIC";
    percentOfNotionalPortfolio: number;
    purpose: string[];
  }>;
  reservedForUrgentFixes: Array<{ assetId: string; rationale: string }>;
  quickWinPool: Array<{ assetId: string; rationale: string }>;
  strategicCapexPool: Array<{ assetId: string; rationale: string }>;
  rationale: string[];
  /** Conservative: not dollar amounts unless verified in data source. */
  disclosure: string;
}

export interface OptimizationEngineResult {
  objectiveMode: ObjectiveMode;
  topPriorityAssets: Array<{ assetId: string; reason: string }>;
  recommendedCapitalAllocation: CapitalAllocationOutput;
  commonActionThemes: string[];
  watchlistAssets: Array<{ assetId: string; reason: string }>;
  executiveSummary: string;
}

export type AssetStrategyType =
  | "STABILIZE"
  | "GROWTH"
  | "ESG_UPGRADE"
  | "COMPLIANCE_RECOVERY"
  | "YIELD_PROTECTION"
  | "BALANCED";

export interface AssetManagerActionDraft {
  title: string;
  category: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  expectedImpactBand?: string;
  costBand?: string;
  timelineBand?: string;
  ownerType?: string;
  explanation: string;
  approvalRequired: boolean;
  /** Low-risk automation hint — never bypasses policy in code paths. */
  eligibleForAutoLowRisk?: boolean;
}

export interface PortfolioIntelligenceBundle {
  overview: {
    totalAssets: number;
    averageHealthBand: HealthBand | "UNKNOWN";
    criticalCount: number;
    watchlistCount: number;
    quickWinsCount: number;
    capitalNeedSummary: string;
    policyMode: PolicyAutonomyMode;
  };
  priorities: PortfolioPriorityRow[];
  capitalAllocation: CapitalAllocationOutput;
  watchlist: Array<{ assetId: string; assetName?: string; healthBand: HealthBand; reason: string }>;
  commonThemes: string[];
}

export interface PortfolioReportPayload {
  generatedAt: string;
  policyMode: PolicyAutonomyMode;
  confidenceDisclaimer: string;
  healthSummary: Record<string, unknown>;
  priorityReport: Record<string, unknown>;
  capitalProposal: Record<string, unknown>;
  watchlistReport: Record<string, unknown>;
  executiveMemo: string;
  pendingApprovalsSummary: string;
}
