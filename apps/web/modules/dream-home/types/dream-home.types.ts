/**
 * AI Dream Home Match — user-declared inputs only. Do not add nationality, origin, or inferred “cultural” defaults.
 */
export type DreamHomeIntake = {
  /** Adults + children the user counts as their household. */
  householdSize?: number;
  /** Free text, e.g. "2 children under 10, 1 parent visiting often". */
  ageGroupsNote?: string;
  /** 0–1 how often guests stay overnight / extended family visits. */
  guestFrequency?: number;
  workFromHome?: boolean;
  /** 0–1 */
  wfhImportance?: number;
  hasPets?: boolean;
  petNote?: string;
  /** User’s max purchase budget in major currency (same unit as listing price). */
  maxBudget?: number;
  city?: string;
  /** km or "same city" */
  commuteNote?: string;
  lifestyleNote?: string;
  entertainingStyle?: "quiet" | "moderate" | "social" | "unsure";
  privacyPreference?: "high" | "balanced" | "open";
  cookingHabits?: string;
  accessibilityNeeds?: string;
  designTaste?: string;
  /** User-selected culture / practice tags (e.g. prayer room, multigenerational) — never inferred. */
  culturalLifestyleTags?: string[];
  noiseTolerance?: "quiet" | "moderate" | "lively";
  indoorOutdoorPriority?: "indoor" | "balanced" | "outdoor";
  preferredArchitecturalInspiration?: string;
  /** Extra freeform — normalized server-side; unsafe keys stripped. */
  freeform?: string;
};

export type DreamHomeSearchFilters = {
  propertyType?: string[];
  bedroomsMin?: number;
  bathroomsMin?: number;
  /** Major currency (same as FSBO public search maxPrice). */
  maxBudget?: number;
  amenities?: string[];
  keywords?: string[];
  city?: string;
};

/**
 * AI + deterministic interpretation output (structured).
 */
export type DreamHomeProfile = {
  /** Short persona / headline, e.g. "Private family-centered modern home…". */
  householdProfile: string;
  propertyTraits: string[];
  neighborhoodTraits: string[];
  searchFilters: DreamHomeSearchFilters;
  rationale: string[];
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
  matchScore: number;
  whyThisFits: string[];
};

export type DreamHomeMatchResult = {
  profile: DreamHomeProfile;
  listings: DreamHomeMatchedListing[];
  tradeoffs: string[];
  source: "ai" | "deterministic";
};
