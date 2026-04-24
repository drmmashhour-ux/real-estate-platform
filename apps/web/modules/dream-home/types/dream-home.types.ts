/**
 * Dream Home — user-declared inputs only. No nationality, ethnicity, religion, or inferred protected traits.
 */

export type DreamHomeQuestionnaireInput = {
  familySize?: number;
  adultsCount?: number;
  childrenCount?: number;
  eldersInHome?: boolean;
  guestsFrequency?: "low" | "medium" | "high";
  workFromHome?: "none" | "sometimes" | "full_time";
  budgetMin?: number | null;
  budgetMax?: number | null;
  transactionType?: "buy" | "rent" | "bnb_stay";
  city?: string | null;
  neighborhoods?: string[];
  radiusKm?: number | null;
  commutePriority?: "low" | "medium" | "high";
  privacyPreference?: "low" | "medium" | "high";
  hostingPreference?: "low" | "medium" | "high";
  kitchenPriority?: "low" | "medium" | "high";
  outdoorPriority?: "low" | "medium" | "high";
  accessibilityNeeds?: string[];
  pets?: boolean;
  noiseTolerance?: "low" | "medium" | "high";
  stylePreferences?: string[];
  specialSpaces?: string[];
  lifestyleTags?: string[];
  mustHaves?: string[];
  dealBreakers?: string[];
  /** Legacy / extended freeform — merged with existing intake */
  [key: string]: unknown;
};

/**
 * @deprecated Use DreamHomeQuestionnaireInput for new code; kept for existing wizard + APIs.
 */
export type DreamHomeIntake = {
  householdSize?: number;
  ageGroupsNote?: string;
  guestFrequency?: number;
  workFromHome?: boolean;
  wfhImportance?: number;
  hasPets?: boolean;
  petNote?: string;
  maxBudget?: number;
  city?: string;
  commuteNote?: string;
  lifestyleNote?: string;
  entertainingStyle?: "quiet" | "moderate" | "social" | "unsure";
  privacyPreference?: "high" | "balanced" | "open" | "low" | "medium" | "high";
  cookingHabits?: string;
  accessibilityNeeds?: string;
  designTaste?: string;
  culturalLifestyleTags?: string[];
  noiseTolerance?: "quiet" | "moderate" | "lively" | "low" | "medium" | "high";
  indoorOutdoorPriority?: "indoor" | "balanced" | "outdoor";
  preferredArchitecturalInspiration?: string;
  freeform?: string;
};

export type DreamHomeSearchFilters = {
  propertyType?: string[];
  minBedrooms?: number;
  minBathrooms?: number;
  /** @deprecated use minBedrooms in new code */
  bedroomsMin?: number;
  /** @deprecated use minBathrooms in new code */
  bathroomsMin?: number;
  budgetMin?: number;
  budgetMax?: number;
  /** @deprecated */
  maxBudget?: number;
  amenities?: string[];
  keywords?: string[];
  city?: string;
  neighborhoods?: string[];
  maxCommuteMinutes?: number;
};

export type DreamHomeRankingPreferences = {
  weightPrivacy: number;
  weightHosting: number;
  weightFamilyFunctionality: number;
  weightKitchen: number;
  weightOutdoor: number;
  weightWorkFromHome: number;
  weightAccessibility: number;
  weightQuietness: number;
  weightStyleFit: number;
};

export type DreamHomeProfile = {
  /** One-line headline */
  summary?: string;
  householdProfile: string;
  /** Tags from the questionnaire + explicit rules (e.g. hosting/guests), never inferred protected traits */
  lifestyleTags?: string[];
  propertyTraits: string[];
  neighborhoodTraits: string[];
  searchFilters: DreamHomeSearchFilters;
  /** Deterministic + explainable ranking knobs */
  rankingPreferences?: DreamHomeRankingPreferences;
  rationale: string[];
  tradeoffs?: string[];
  warnings?: string[];
};

export type DreamHomeMatchResult = {
  profile: DreamHomeProfile;
  listings: DreamHomeMatchedListing[];
  tradeoffs: string[];
  source: "ai" | "deterministic";
  warnings?: string[];
};

export type DreamHomeMatchedListing = {
  id: string;
  title: string;
  city: string;
  priceCents: number;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  propertyType: string | null;
  /** Excerpt for deterministic ranking / keyword fit; optional if absent from query */
  description?: string | null;
  matchScore: number;
  whyThisFits: string[];
  /** Explainable sub-scores (optional) */
  scoreBreakdown?: { filterFit: number; lifestyleFit: number; keywordFit: number; explanation: string[] };
};

export type DreamHomeSessionState = {
  step: number;
  questionnaire: Partial<DreamHomeQuestionnaireInput> & Record<string, unknown>;
  /** ISO */
  updatedAt: string;
};

export type DreamHomePromptInput = {
  normalizedQuestionnaire: Record<string, unknown>;
  systemConstraints: string;
};

export type DreamHomeInsightCard = { title: string; body: string; kind: "tip" | "caution" | "highlight" };
