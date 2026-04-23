import type { HubType } from "@/modules/market-domination/market-domination.types";

export type LaunchPhaseId =
  | "PRE_LAUNCH"
  | "LAUNCH"
  | "EARLY_TRACTION"
  | "SCALE"
  | "DOMINATION";

export type StepCategory = "SALES" | "MARKETING" | "SUPPLY" | "PRODUCT" | "OPS";

export type StepPriority = "P0" | "P1" | "P2" | "P3";

export type EffortTier = "XS" | "S" | "M" | "L" | "XL";

export type ImpactTier = "LOW" | "MEDIUM" | "HIGH";

export type StepStatus = "pending" | "in_progress" | "blocked" | "completed";

/** Inputs bundled from Market Domination, Growth Brain, Revenue Predictor, etc. */
export type LaunchIntegrationSnapshot = {
  territoryId: string;
  territoryName: string;
  regionLabel: string;
  readinessScore: number;
  readinessBand: string;
  dominationScore: number;
  competitorPressure: number;
  supplyDemandRatio: number;
  conversionRate: number;
  leadVolumeProxy: number;
  dominantHubs: HubType[];
  gapsSummary: string[];
  growthOpportunityTitles: string[];
  growthActionSummaries: string[];
  revenuePredictorNote: string | null;
};

export type PlaybookPhase = {
  id: LaunchPhaseId;
  label: string;
  objectives: string[];
  actions: string[];
  successMetrics: string[];
  /** Rough calendar span for planning — not a promise */
  estimatedWeeksSpan: number;
};

export type CityPlaybook = {
  territoryId: string;
  territoryName: string;
  generatedAtIso: string;
  launchStrategySummary: string;
  priorityHubs: HubType[];
  targetSegments: string[];
  estimatedTimelineWeeks: number;
  phases: PlaybookPhase[];
};

export type LaunchStep = {
  id: string;
  phaseId: LaunchPhaseId;
  title: string;
  description: string;
  category: StepCategory;
  assignedHub: HubType;
  priority: StepPriority;
  estimatedEffort: EffortTier;
  expectedImpact: ImpactTier;
  dependencies: string[];
  successMetric: string;
  /** Cross-links to Growth Brain action types where relevant */
  linkedGrowthThemes?: string[];
  /** True when injected by adaptation engine */
  isAdaptation?: boolean;
};

export type StepExecutionRecord = {
  stepId: string;
  status: StepStatus;
  assignedTo?: string;
  notes?: string;
  resultNotes?: string;
  updatedAtIso: string;
  completedAtIso?: string;
};

/** Tracked KPIs — manual entry or future warehouse sync */
export type TerritoryPerformanceMetrics = {
  leadsGenerated: number;
  brokersOnboarded: number;
  listingsCreated: number;
  bookingsBnhub: number;
  dealsClosed: number;
  revenueCents: number;
  growthRate: number;
  updatedAtIso: string;
};

export type ProgressSummary = {
  territoryId: string;
  totalSteps: number;
  completedCount: number;
  inProgressCount: number;
  blockedCount: number;
  pendingCount: number;
  completionPercent: number;
  velocityStepsPerWeek: number;
  delays: string[];
  riskAreas: string[];
  startedAtIso?: string;
};

export type AdaptationSuggestion = {
  id: string;
  title: string;
  rationale: string;
  suggestedSteps: string[];
  urgency: "low" | "medium" | "high";
};

export type AdaptationResult = {
  suggestions: AdaptationSuggestion[];
  injectedSteps: LaunchStep[];
  metricsDrivers: string[];
};

export type CityLaunchAlert = {
  id: string;
  kind:
    | "phase_delayed"
    | "milestone_at_risk"
    | "traction_strong"
    | "accelerate_window"
    | "blocker_chain";
  title: string;
  body: string;
  severity: "info" | "watch" | "important";
  territoryId: string;
};

export type PlaybookExplainability = {
  headline: string;
  primaryDrivers: string[];
  cautions: string[];
  aiAssistHooks: string[];
};

export type CityLaunchFullView = {
  playbook: CityPlaybook;
  steps: LaunchStep[];
  integration: LaunchIntegrationSnapshot;
  progress: ProgressSummary;
  metrics: TerritoryPerformanceMetrics;
  adaptation: AdaptationResult;
  alerts: CityLaunchAlert[];
  explainability: PlaybookExplainability;
  currentPhaseId: LaunchPhaseId;
};
