/**
 * Revenue Engine v4 — shared types (not legal/financial advice).
 */

export type ConfidenceBand = "high" | "medium" | "low";

export type RevenuePotentialEvaluation = {
  listingId: string;
  revenuePotentialScore: number;
  confidence: ConfidenceBand;
  drivers: string[];
  cautions: string[];
};

export type PrioritizedRevenueItem = {
  entityType: "fsbo_listing" | "short_term_listing";
  entityId: string;
  priorityScore: number;
  summary: string;
};
