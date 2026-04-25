/**
 * Executive board report view — JSON-serializable, auditable.
 * Narrative layers must only reference fields present here (no invented metrics).
 */

export type DataSourceTrace = {
  tables: string[];
  description: string;
  /** When counts are low or definitions are approximate */
  partialDataNote?: string;
};

export type TracedNumber = {
  value: number | null;
  trace: DataSourceTrace;
};

export type TracedStringList = {
  items: string[];
  trace: DataSourceTrace;
};

export type KpiSection = {
  periodKey: string;
  range: { startUtc: string; endUtcExclusive: string };
  leadsCreated: TracedNumber;
  pipelineDealsCreated: TracedNumber;
  pipelineDealsClosedInPeriod: TracedNumber;
  /** Operational definition: favorable committee recommendations / (favorable + unfavorable); null if denominator zero. */
  committeeFavorableRate: TracedNumber;
  /** Sum of `InvestmentPipelineCapitalStack.totalCapitalRequired` for active pipeline deals with a stack row; excludes nulls. */
  pipelineCapitalRequiredSum: TracedNumber;
  /** Mean days from deal createdAt to closedAt for deals with closedAt in range; null if none. */
  avgPipelineCloseCycleDays: TracedNumber;
  /** Share of leads created in range whose pipelineStatus is not "new" (operational touch proxy). */
  leadContactedOrBeyondRate: TracedNumber;
  /** Share of leads created in range that are pipelineStatus "won". */
  leadWonAmongCreatedRate: TracedNumber;
  assumptions: string[];
};

export type StrategyBenchmarkRow = {
  strategyKey: string;
  domain: string;
  totalUses: number;
  wins: number;
  losses: number;
  stalls: number;
  avgClosingTime: number | null;
  closingSamples: number;
};

export type StrategySection = {
  benchmarkTop: StrategyBenchmarkRow[];
  benchmarkWeak: StrategyBenchmarkRow[];
  reinforcementTopArms: {
    strategyKey: string;
    domain: string;
    contextBucket: string;
    pulls: number;
    avgReward: number | null;
  }[];
  reinforcementWeakArms: {
    strategyKey: string;
    domain: string;
    contextBucket: string;
    pulls: number;
    avgReward: number | null;
  }[];
  vsPreviousPeriod: {
    strategyExecutionEventsDelta: number | null;
    reinforcementDecisionsDelta: number | null;
    trace: DataSourceTrace;
  };
  assumptions: string[];
};

export type PortfolioDealHighlight = {
  dealId: string;
  title: string;
  pipelineStage: string;
  underwritingLabel: string | null;
  underwritingRecommendation: string | null;
  brokerName: string | null;
};

export type PortfolioSection = {
  highRiskDeals: PortfolioDealHighlight[];
  highOpportunityDeals: PortfolioDealHighlight[];
  brokerHighlights: { brokerName: string; activeDealCount: number }[];
  assumptions: string[];
};

export type InvestorSection = {
  opportunityCountInPeriod: TracedNumber;
  meanExpectedRoiPercent: TracedNumber;
  riskLevelCounts: Record<string, number>;
  capitalStackTotals: {
    totalCapitalRequiredSum: number | null;
    seniorDebtSum: number | null;
    mezzanineSum: number | null;
    preferredEquitySum: number | null;
    commonEquitySum: number | null;
    dealsWithStack: number;
    trace: DataSourceTrace;
  };
  expansionNotes: string[];
  assumptions: string[];
};

export type AutonomySection = {
  actionsCreatedInPeriod: TracedNumber;
  byStatus: Record<string, number>;
  approvals: TracedNumber;
  blockedOrRejected: TracedNumber;
  autonomyModeSummary: string;
  assumptions: string[];
};

export type ExecutiveSummarySection = {
  headline: string;
  periodLabel: string;
  dataFreshnessNote: string;
};

export type RecommendationsSection = {
  /** Machine-generated suggestions tied to report fields only; human review required. */
  items: string[];
  trace: DataSourceTrace;
};

export type ExecutiveNarrativeBlock = {
  summaryText: string;
  keyInsights: string[];
  changesVsPreviousPeriod: string[];
  topRisks: string[];
  topOpportunities: string[];
  recommendedActions: string[];
  assumptions: string[];
};

export type ExecutiveReportView = {
  schemaVersion: 1;
  periodKey: string;
  generatedAtUtc: string;
  summary: ExecutiveSummarySection;
  kpi: KpiSection;
  strategy: StrategySection;
  portfolio: PortfolioSection;
  investor: InvestorSection;
  autonomy: AutonomySection;
  recommendations: RecommendationsSection;
  narrative: ExecutiveNarrativeBlock;
};
