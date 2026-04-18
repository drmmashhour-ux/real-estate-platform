/**
 * LECIPM Autonomous A/B Testing — types (maps to Prisma Experiment / ExperimentVariant / ExperimentOutcomeDecision).
 */

export type ExperimentDomain = "ads" | "landing" | "listing_page" | "cta" | "copy";

export type ExperimentStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "archived";

export type VariantOutcomeStatus = "active" | "winner" | "loser" | "inconclusive";

export type AbExperimentView = {
  id: string;
  name: string;
  domain: ExperimentDomain;
  objective: string | null;
  metricPrimary: string;
  metricSecondary: unknown[];
  status: ExperimentStatus;
  audienceScope: unknown;
  startedAt: string | null;
  endedAt: string | null;
  notes: unknown;
  slug: string;
  targetSurface: string;
};

export type AbVariantView = {
  id: string;
  experimentId: string;
  key: string;
  label: string;
  payload: unknown;
  status: VariantOutcomeStatus;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  revenue: number;
  ctr: number | null;
  cvr: number | null;
  notes: unknown;
};

export type AbMetadataPayload = {
  experimentId: string;
  variantId: string;
  variantKey: string;
  domain: ExperimentDomain;
};

export type ExperimentOutcomeDecisionView = {
  status: "winner_found" | "inconclusive" | "insufficient_data";
  winningVariantId?: string;
  losingVariantIds?: string[];
  confidence: number;
  rationale: string[];
  recommendation: string;
};
