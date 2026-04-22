/** Senior Living Hub — shared types (aligned with Prisma enums as strings). */

export type SeniorCareLevel = "AUTONOMOUS" | "SEMI_AUTONOMOUS" | "ASSISTED" | "FULL_CARE";

export type SeniorUnitType = "STUDIO" | "1BR" | "2BR" | "PRIVATE_ROOM";

export type SeniorServiceCategory = "MEDICAL" | "WELLNESS" | "DAILY_LIFE";

export type SeniorNeedsLevel = "LOW" | "MEDIUM" | "HIGH";

export type SeniorLeadStatus = "NEW" | "CONTACTED" | "VISIT_BOOKED" | "CLOSED";

export type SeniorMobilityLevel = "INDEPENDENT" | "LIMITED" | "DEPENDENT";

export type SeniorMedicalNeedsProfile = "NONE" | "LIGHT" | "HEAVY";

export type ListResidencesFilters = {
  city?: string | null;
  province?: string | null;
  careLevel?: SeniorCareLevel | string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  serviceCategory?: SeniorServiceCategory | string | null;
  serviceNameContains?: string | null;
  verifiedOnly?: boolean;
  take?: number;
};

/** One scored residence from matchResidences — explainable, blend of rule score + outcomes. */
export type MatchResultRow = {
  residenceId: string;
  /** Final 0–100 score shown to families. */
  score: number;
  /** Rule-based partial blend before outcome multiplier (0–100). */
  baseScore: number;
  /** Platform funnel outcome score (0–100). */
  performanceScore: number;
  /** Short, plain-language bullets (never jargon). */
  explanation: string[];
  /** @deprecated Alias of `explanation` for older clients */
  reasons: string[];
};

export type AiInsightRow = {
  kind: "recommendation" | "mismatch" | "alternative";
  message: string;
};
