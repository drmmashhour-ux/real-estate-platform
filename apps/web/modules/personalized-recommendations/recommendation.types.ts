export type RecommendationMode = "BUYER" | "RENTER" | "BROKER" | "INVESTOR";

export type RecommendationEntityType =
  | "FSBO_LISTING"
  | "CRM_LISTING"
  | "SHORT_TERM_LISTING"
  | "DEAL"
  | "LEAD"
  | "INVESTMENT_PIPELINE_DEAL"
  | "OPPORTUNITY";

export type PersonalizedRecommendationItem = {
  entityType: RecommendationEntityType;
  entityId: string;
  score: number;
  /** 0–100 confidence in this suggestion (data sufficiency). */
  confidence: number;
  explanationUserSafe: string;
  /** Admin / debug — factor keys and weights. */
  factorsInternal: Record<string, number>;
  title?: string;
  subtitle?: string;
  href?: string;
  imageUrl?: string | null;
};

export type PersonalizedRecommendationResult = {
  mode: RecommendationMode;
  personalizationEnabled: boolean;
  personalizationApplied: boolean;
  coldStart: boolean;
  marketSegment: string | null;
  items: PersonalizedRecommendationItem[];
  privacyNote: string;
  debug?: {
    topFactors: { key: string; weight: number }[];
    profileSummary: Record<string, unknown>;
  };
};

export type GetPersonalizedRecommendationsInput = {
  userId: string | null;
  mode: RecommendationMode;
  limit?: number;
  marketSegment?: string | null;
  /** When false, same catalog but no behavior/memory boosts. */
  personalization?: boolean;
  /** Include internal factor breakdown (admin/debug). */
  debug?: boolean;
  /** Optional city filter (buyer/renter). */
  cityHint?: string | null;
  /** Exclude these entity ids (e.g. current listing). */
  excludeEntityIds?: string[];
};

export const RECOMMENDATION_TRACK_EVENTS = [
  "shown",
  "clicked",
  "saved",
  "messaged",
  "booked",
  "offered",
  "packet_opened",
  "invested",
] as const;

export type RecommendationTrackEvent = (typeof RECOMMENDATION_TRACK_EVENTS)[number];
