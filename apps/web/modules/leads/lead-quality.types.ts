/**
 * Lead quality + advisory pricing (V1) — additive; does not replace revenue unlock pricing.
 */

export type LeadQualityBand = "low" | "medium" | "high" | "premium";

export type LeadQualityBreakdown = {
  completenessScore: number;
  intentScore: number;
  budgetScore: number;
  urgencyScore: number;
  engagementScore: number;
};

export type LeadQualitySummary = {
  leadId: string;
  score: number;
  band: LeadQualityBand;
  breakdown: LeadQualityBreakdown;
  strongSignals: string[];
  weakSignals: string[];
  suggestedPrice: number;
  createdAt: string;
};
