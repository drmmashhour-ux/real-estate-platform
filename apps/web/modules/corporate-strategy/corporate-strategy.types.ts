/** Advisory-only; not employment offers, not budget execution. */

export type StrategyTriage = "low" | "medium" | "high";

export type HiringRoleKind = "broker" | "operations" | "engineering" | "coordination";

export type HiringRoleRecommendation = {
  kind: HiringRoleKind;
  priority: StrategyTriage;
  headcountHint: { min: number; max: number; basis: string };
  rationale: string[];
  dataTrace: string;
};

export type HiringStrategy = {
  disclaimer: string;
  dataSources: string[];
  roles: HiringRoleRecommendation[];
};

export type BudgetLineAction = "increase" | "reduce" | "maintain" | "experiment";

export type BudgetStrategyLine = {
  label: string;
  scope: "segment" | "market" | "channel" | "product";
  scopeKey: string;
  action: BudgetLineAction;
  priority: StrategyTriage;
  rationale: string[];
  dataTrace: string;
};

export type BudgetStrategy = {
  disclaimer: string;
  dataSources: string[];
  lines: BudgetStrategyLine[];
};

export type RoadmapItem = {
  key: string;
  title: string;
  priority: StrategyTriage;
  rationale: string[];
  dataTrace: string;
};

export type ProductRoadmapStrategy = {
  disclaimer: string;
  dataSources: string[];
  prioritize: RoadmapItem[];
  deprioritize: RoadmapItem[];
};

export type BottleneckSeverity = "info" | "low" | "medium" | "high";

export type BottleneckInsight = {
  id: string;
  kind: "cycle_time" | "capacity" | "conversion" | "follow_up" | "pipeline_bias" | "other";
  severity: BottleneckSeverity;
  title: string;
  rationale: string;
  dataTrace: string;
  suggestedResponse: string;
};

export type StrategicRisk = {
  type: string;
  severity: StrategyTriage;
  message: string;
  rationale: string;
  mitigation: string;
};

export type QuarterlyPlan = {
  disclaimer: string;
  topPriorities: { rank: number; title: string; rationale: string; category: "HIRING" | "BUDGET" | "PRODUCT" | "OPS" | "EXPANSION" }[];
  hiringFocus: string[];
  budgetFocus: string[];
  productFocus: string[];
  expansionFocus: string[];
  riskMitigation: string[];
};

export type CorporateStrategyView = {
  periodKey: string;
  generatedAt: string;
  disclaimer: string;
  dataSources: string[];
  summary: { headline: string; bullets: string[] };
  hiring: HiringStrategy;
  budget: BudgetStrategy;
  roadmap: ProductRoadmapStrategy;
  bottlenecks: BottleneckInsight[];
  risks: StrategicRisk[];
  quarterly: QuarterlyPlan;
};
