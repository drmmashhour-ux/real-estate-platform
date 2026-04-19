/**
 * Market expansion intelligence — internal advisory only; not causal proof; no auto-outreach.
 */

export type ExpansionReadiness = "low" | "medium" | "high";
export type ExpansionConfidence = "low" | "medium" | "high";

export type MarketExpansionCandidate = {
  city: string;
  score: number;
  demandSignal?: number;
  supplySignal?: number;
  competitionSignal?: number;
  similarityToTopCity?: number;
  readiness: ExpansionReadiness;
  confidence: ExpansionConfidence;
  rationale: string;
  warnings: string[];
};

export type MarketExpansionRejected = {
  city: string;
  reason: string;
};

export type MarketExpansionRecommendation = {
  referenceCity: string | null;
  topCandidates: MarketExpansionCandidate[];
  rejectedCandidates: MarketExpansionRejected[];
  insights: string[];
  generatedAt: string;
  windowDays: number;
};
