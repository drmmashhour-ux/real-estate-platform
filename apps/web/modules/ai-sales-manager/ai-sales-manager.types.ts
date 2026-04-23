/**
 * AI Sales Manager — coaching & performance intelligence (not an autonomous dialer).
 * All suggestions are explainable; humans approve actions.
 */

import type { ScenarioPersonality } from "@/modules/training-scenarios/training-scenarios.types";

export type ImprovementTrend = "up" | "flat" | "down";

export type RecommendationUrgency = "low" | "medium" | "high";

export type SalesCallOutcomeHint = "demo_booked" | "meeting_set" | "lost" | "no_decision" | "won" | "continuing";

/** Snapshot merged from CRM, manual logs, or assistant — never auto-dialed. */
export type CallOutcomeUpdate = {
  /** Calendar invite / demo secured */
  demoBooked?: boolean;
  /** Deal won / advance */
  closeWon?: boolean;
  closeLost?: boolean;
  /** Heuristic 0–100 */
  controlScore?: number;
  closingScore?: number;
  /** Snippet or label, e.g. "already have leads" */
  objectionsRaised?: string[];
  /** Matching scenario personality if inferred */
  clientPersonalityHint?: ScenarioPersonality;
  /** DISC / scenario axis */
  scenarioPersonality?: ScenarioPersonality;
};

export type TrainingOutcomeUpdate = {
  scenarioId: string;
  avgScore: number;
  controlScore: number;
  closingScore: number;
  won: boolean;
  /** Scenario metadata — resolved by integration */
  personality?: ScenarioPersonality;
  scenarioAudience?: "BROKER" | "INVESTOR";
  difficulty?: string;
};

export type SalesProfile = {
  userId: string;
  displayName?: string;
  totalCalls: number;
  demosBooked: number;
  closesWon: number;
  closesLost: number;
  /** Rolling mean of lab scores */
  averageTrainingScore: number;
  averageControlScore: number;
  averageClosingScore: number;
  trainingSessionCount: number;
  /** Ordered by frequency */
  mostCommonObjections: string[];
  /** Raw counts for explainability */
  objectionCounts: Record<string, number>;
  strongestPersonalityMatch: ScenarioPersonality | null;
  weakestPersonalityMatch: ScenarioPersonality | null;
  strongestScenarioType: "BROKER" | "INVESTOR" | null;
  weakestScenarioType: "BROKER" | "INVESTOR" | null;
  improvementTrend: ImprovementTrend;
  managerNotes: string;
  lastUpdatedIso: string;
  /** Last N overall scores for trend / alerts */
  scoreHistory: number[];
  /** Aggregated practice performance by personality */
  personalityAvgScore: Partial<Record<ScenarioPersonality, number>>;
  personalitySessionCount: Partial<Record<ScenarioPersonality, number>>;
  audienceAvgScore: Partial<Record<"BROKER" | "INVESTOR", number>>;
  audienceSessionCount: Partial<Record<"BROKER" | "INVESTOR", number>>;
  /** From call replay analyzer-style ingest */
  replayAnalysisCount: number;
  weakMomentSignals: string[];
};

export type ExplainableTrigger = {
  label: string;
  value: string | number;
};

export type CoachingRecommendation = {
  id: string;
  title: string;
  reason: string;
  expectedImprovementArea: string;
  suggestedScenarioIds: string[];
  urgency: RecommendationUrgency;
  triggers: ExplainableTrigger[];
  createdAtIso: string;
};

export type StrategySuggestion = {
  id: string;
  title: string;
  explanation: string;
  whenToUse: string;
  exampleLine: string;
  triggers: ExplainableTrigger[];
};

export type ForecastBand = {
  demoBookingRate: number;
  closeRate: number;
  confidence: number;
  narrative: string;
  riskFactors: string[];
};

export type PerformanceForecast = {
  userId: string;
  current: ForecastBand;
  bestCase: ForecastBand;
  /** If rep follows top 1–2 coaching priorities */
  ifCoachingFollowed: ForecastBand;
  generatedAtIso: string;
};

export type AlertKind =
  | "performance_drop"
  | "objection_spike"
  | "rapid_improvement"
  | "ready_harder_scenarios"
  | "close_rate_threshold"
  | "coaching_opportunity";

export type SalesAlert = {
  alertId: string;
  userId: string;
  kind: AlertKind;
  severity: "info" | "warn" | "positive";
  title: string;
  body: string;
  triggers: ExplainableTrigger[];
  createdAtIso: string;
  /** Deduplicate repeated generation */
  dedupeKey?: string;
};

export type AssignmentRecord = {
  assignmentId: string;
  userId: string;
  scenarioIds: string[];
  note: string;
  assignedAtIso: string;
  source: "ai_sales_manager" | "manager";
};

export type OverallSalesScore = {
  overall: number;
  confidence: number;
  /** 0–100 contributing factors */
  factors: { label: string; weight: number; contribution: number; explanation: string }[];
};

export type SalesManagerSummary = {
  generatedAtIso: string;
  totalUsers: number;
  aggregate: {
    totalCalls: number;
    demosBooked: number;
    closesWon: number;
    avgTrainingScore: number;
    avgControlScore: number;
    avgClosingScore: number;
    demoRate: number;
    closeRate: number;
  };
  topPerformers: { userId: string; displayName?: string; overallScore: number }[];
  needsSupport: { userId: string; displayName?: string; overallScore: number; reasons: string[] }[];
  commonObjections: { label: string; count: number }[];
  coachingOpportunities: string[];
  trendSummary: string;
};

export type TeamPerformanceSummary = {
  teamId: string;
  teamName: string;
  memberCount: number;
  aggregate: SalesManagerSummary["aggregate"];
  members: {
    memberId: string;
    displayName: string;
    overallScore: number;
    trend: ImprovementTrend;
    topWeakness?: string;
  }[];
  commonObjections: { label: string; count: number }[];
  biggestGaps: string[];
};

export type ImprovementOpportunity = {
  memberId: string;
  displayName: string;
  priority: number;
  summary: string;
  suggestedScenarioIds: string[];
};

export type CoachingAnalysis = {
  strengths: string[];
  weaknesses: string[];
  trainingPriorityAreas: string[];
};
