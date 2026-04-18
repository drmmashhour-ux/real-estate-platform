/**
 * Smart lead routing V1 — advisory ranking only; no auto-assignment.
 */

export type BrokerRoutingFitBand = "low" | "watch" | "good" | "strong";

export type BrokerRoutingScoreBreakdown = {
  regionFitScore: number;
  intentFitScore: number;
  performanceFitScore: number;
  responseFitScore: number;
  availabilityFitScore: number;
};

export type BrokerRoutingCandidate = {
  brokerId: string;
  brokerName?: string;
  rankScore: number;
  fitBand: BrokerRoutingFitBand;
  breakdown: BrokerRoutingScoreBreakdown;
  why: string[];
};

export type LeadRoutingSummary = {
  leadId: string;
  topCandidates: BrokerRoutingCandidate[];
  routingNotes: string[];
  createdAt: string;
};

export type LeadRoutingReadiness = {
  totalRoutableBrokers: number;
  routingNotes: string[];
  experimentsAdvisable: boolean;
};
