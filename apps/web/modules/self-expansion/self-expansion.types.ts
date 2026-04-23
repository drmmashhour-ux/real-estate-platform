/** Self-Expansion Engine — strategic territory expansion (recommendation layer only; v1 never auto-launches). */

export type ExpansionEntryHub =
  | "BROKER"
  | "LISTINGS"
  | "BNHUB"
  | "INVESTOR"
  | "RESIDENCE_SERVICES";

export type ExpansionRecommendationActionBand = "WATCH" | "PREPARE" | "ENTER" | "SCALE" | "PAUSE";

export type ExpansionPhaseId = "DISCOVERY" | "PREPARE" | "TEST" | "LAUNCH" | "EXPAND" | "DOMINATE";

export type ExpansionDecisionStatus =
  | "PROPOSED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAUSED";

export type ExpansionExecutionSafety = "NEVER_AUTO" | "APPROVAL_REQUIRED" | "ADVISORY_ONLY";

export type ExpansionImpactBand = "low" | "moderate" | "meaningful" | "uncertain_thin_data";

export type ExpansionUrgency = "low" | "medium" | "high" | "critical";

export type ExpansionEffort = "low" | "medium" | "high";

export type ExpansionCategory =
  | "priority_market"
  | "supply_gap"
  | "demand_surge"
  | "risk_pause"
  | "scale_win";

export type TerritoryArchetype =
  | "metro_core"
  | "satellite_commuter"
  | "tourist_corridor"
  | "investor_dense"
  | "sprawl_low_density"
  | "regional_hub";

/** Per-territory inputs aggregated for scoring (no PII). */
export type TerritoryExpansionProfile = {
  territoryId: string;
  city: string;
  region: string;
  country: string;
  archetype: TerritoryArchetype;
  readinessScore: number;
  readinessBand: string;
  dominationScore: number;
  strategicFit: number;
  demandSignals: {
    buyer: number;
    renter: number;
    investor: number;
    leadVolume: number;
  };
  supplySignals: {
    listings: number;
    bnhub: number;
    residence: number;
    ratio: number;
  };
  brokerDensity: number;
  bnhubOpportunity: number;
  investorInterest: number;
  competitorPressure: number;
  regulatoryReadinessFlags: string[];
  operationalCapacity: number;
  currentTraction: {
    revenueCents: number;
    bookings: number;
    conversionRate: number;
    growthRate: number;
  };
  /** Optional warnings from upstream aggregation (thin telemetry). */
  coverageWarnings?: string[];
};

export type SelfExpansionPlatformContext = {
  generatedAt: string;
  territories: TerritoryExpansionProfile[];
  marketDominationGeneratedAt: string;
  aiCeo: {
    thinDataWarnings: string[];
    executiveRisk: string | null;
  };
  revenuePredictor: {
    generatedAtIso: string;
    totalForecastBaseCents: number;
    repCount: number;
    biggestLeakCents: number;
    biggestUpsideCents: number;
  };
  growthBrainTopRegion: string | null;
  regulatoryDisclaimer: string;
  thinDataWarnings: string[];
};

export type ExpansionSignalRef = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
};

export type TerritoryScoreResult = {
  territoryId: string;
  expansionScore: number;
  confidence: number;
  strengths: string[];
  blockers: string[];
  recommendedActionBand: ExpansionRecommendationActionBand;
};

export type EntryStrategyResult = {
  territoryId: string;
  entryHub: ExpansionEntryHub;
  secondaryHub?: ExpansionEntryHub;
  targetSegment: string;
  firstActions: string[];
  expectedRisks: string[];
  acquisitionMethod: string;
  gtmAngle: string;
};

export type PhasePlanResult = {
  territoryId: string;
  currentSuggestedPhase: ExpansionPhaseId;
  phaseGoals: string[];
  phaseBlockers: string[];
  exitCriteria: string[];
};

export type ExpansionExplanation = {
  dataContributors: ExpansionSignalRef[];
  whyPrioritized: string;
  whyThisHub: string;
  majorRisks: string[];
  phaseRationale: string;
  dataBasisNote: string;
};

export type SelfExpansionRecommendationDraft = {
  fingerprint: string;
  territoryId: string;
  title: string;
  category: ExpansionCategory;
  summary: string;
  expansionScore: number;
  confidenceScore: number;
  urgency: ExpansionUrgency;
  expectedImpactBand: ExpansionImpactBand;
  requiredEffort: ExpansionEffort;
  entryHub: ExpansionEntryHub;
  targetSegment: string;
  phaseSuggested: ExpansionPhaseId;
  recommendationActionBand: ExpansionRecommendationActionBand;
  executionSafety: ExpansionExecutionSafety;
  phasedPlanSummary: string;
  firstActions: string[];
  expectedRisks: string[];
  signalsUsed: ExpansionSignalRef[];
  explanation: ExpansionExplanation;
  inputSnapshot: Record<string, unknown>;
  entryStrategy: EntryStrategyResult;
  phasePlan: PhasePlanResult;
  scoreBreakdown: TerritoryScoreResult;
};

export type ExpansionMeasurementSummary = {
  recommendationCount: number;
  proposedCount: number;
  approvedCount: number;
  rejectedCount: number;
  inProgressCount: number;
  completedCount: number;
  pausedCount: number;
  avgConfidenceCompleted: number | null;
  territoriesWithLaunches: number;
};

export type ExpansionLearningWeights = {
  hubLift: Record<string, number>;
  blockerPenalty: Record<string, number>;
  archetypeLift: Record<string, number>;
};
